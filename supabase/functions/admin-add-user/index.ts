import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return respond({ ok: false, code: 'UNAUTHORIZED', message: 'Não autorizado' }, 401);
    }

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      return respond({ ok: false, code: 'UNAUTHORIZED', message: 'Não autorizado' }, 401);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin MASTER
    const { data: callerAdmin } = await adminClient
      .from('admin_users')
      .select('level')
      .eq('user_id', callerUser.id)
      .single();

    if (!callerAdmin || callerAdmin.level !== 'master') {
      return respond({ ok: false, code: 'FORBIDDEN', message: 'Apenas admin MASTER pode adicionar administradores' }, 403);
    }

    // Parse request
    const { email, level = 'standard', createIfMissing = false } = await req.json();

    if (!email || typeof email !== 'string') {
      return respond({ ok: false, code: 'INVALID_INPUT', message: 'Email é obrigatório' }, 400);
    }

    const targetLevel = level === 'master' ? 'master' : 'standard';
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`[admin-add-user] MASTER ${callerUser.email} adding admin: ${normalizedEmail} (level: ${targetLevel})`);

    // Find user by email using admin API
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 1,
      page: 1,
    });

    // listUsers doesn't support email filter, so we search all
    const { data: allUsersData, error: allUsersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (allUsersError) {
      console.error('Error listing users:', allUsersError);
      return respond({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao buscar usuários' }, 500);
    }

    let targetUser = allUsersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!targetUser) {
      if (!createIfMissing) {
        return respond({
          ok: false,
          code: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado. Marque "Criar usuário se não existir" ou peça para o usuário criar uma conta primeiro.',
        }, 404);
      }

      // Create user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return respond({ ok: false, code: 'CREATE_FAILED', message: `Erro ao criar usuário: ${createError.message}` }, 500);
      }

      targetUser = newUser.user;
      console.log(`[admin-add-user] Created new auth user for ${normalizedEmail}`);
    }

    // Check if already admin
    const { data: existingAdmin } = await adminClient
      .from('admin_users')
      .select('id, level')
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (existingAdmin) {
      if (existingAdmin.level === targetLevel) {
        return respond({ ok: false, code: 'ALREADY_EXISTS', message: `${normalizedEmail} já é administrador (${targetLevel})` }, 409);
      }
      // Update level
      const { error: updateError } = await adminClient
        .from('admin_users')
        .update({ level: targetLevel })
        .eq('id', existingAdmin.id);

      if (updateError) {
        console.error('Error updating admin level:', updateError);
        return respond({ ok: false, code: 'UPDATE_FAILED', message: 'Erro ao atualizar nível do administrador' }, 500);
      }
    } else {
      // Insert new admin
      const { error: insertError } = await adminClient
        .from('admin_users')
        .insert({ user_id: targetUser.id, level: targetLevel });

      if (insertError) {
        console.error('Error inserting admin:', insertError);
        return respond({ ok: false, code: 'INSERT_FAILED', message: `Erro ao adicionar administrador: ${insertError.message}` }, 500);
      }
    }

    // Audit log (matches admin_audit_logs schema: admin_user_id, action, metadata)
    await adminClient.from('admin_audit_logs').insert({
      admin_user_id: callerUser.id,
      action: 'admin_add',
      metadata: {
        target_email: normalizedEmail,
        target_user_id: targetUser.id,
        level: targetLevel,
        created_new_user: !existingAdmin && createIfMissing,
      },
    });

    console.log(`[admin-add-user] Successfully added ${normalizedEmail} as ${targetLevel}`);

    return respond({
      ok: true,
      code: 'SUCCESS',
      message: `${normalizedEmail} adicionado como administrador (${targetLevel})`,
      data: { user_id: targetUser.id, level: targetLevel },
    });

  } catch (error) {
    console.error('Unexpected error in admin-add-user:', error);
    return respond({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }, 500);
  }
});
