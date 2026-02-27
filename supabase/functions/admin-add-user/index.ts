import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function sha256Hex(input: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // Simple hash for audit (not crypto-critical)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

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
      return respond({ ok: false, code: 'UNAUTHORIZED', message: 'Não autorizado' });
    }

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      return respond({ ok: false, code: 'UNAUTHORIZED', message: 'Não autorizado' });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin MASTER
    const { data: callerAdmin } = await adminClient
      .from('admin_users')
      .select('level')
      .eq('user_id', callerUser.id)
      .single();

    if (!callerAdmin) {
      return respond({ ok: false, code: 'FORBIDDEN', message: 'Acesso negado. Apenas administradores.' });
    }

    // Parse request
    const { email, level = 'standard', createIfMissing = false } = await req.json();

    if (!email || typeof email !== 'string') {
      return respond({ ok: false, code: 'INVALID_INPUT', message: 'Email é obrigatório' });
    }

    const targetLevel = level === 'master' ? 'master' : 'standard';

    // Only MASTER can add admins (and especially other masters)
    if (callerAdmin.level !== 'master') {
      if (targetLevel === 'master') {
        return respond({ ok: false, code: 'FORBIDDEN', message: 'Apenas admin MASTER pode criar outro MASTER' });
      }
      // Standard admins also cannot add admins at all
      return respond({ ok: false, code: 'FORBIDDEN', message: 'Apenas admin MASTER pode adicionar administradores' });
    }

    console.log(`[admin-add-user] MASTER ${callerUser.email} adding admin: ${email} (level: ${targetLevel})`);

    // Find user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      return respond({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao buscar usuários' });
    }

    let targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      if (!createIfMissing) {
        return respond({ ok: false, code: 'USER_NOT_FOUND', message: 'Usuário não encontrado. Marque "Criar usuário se não existir" ou peça para o usuário criar uma conta primeiro.' });
      }

      // Create user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return respond({ ok: false, code: 'CREATE_FAILED', message: `Erro ao criar usuário: ${createError.message}` });
      }

      targetUser = newUser.user;
      console.log(`[admin-add-user] Created new user for ${email}`);
    }

    // Upsert in admin_users
    const { error: upsertError } = await adminClient
      .from('admin_users')
      .upsert({
        user_id: targetUser.id,
        level: targetLevel,
        created_by: callerUser.id,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error upserting admin:', upsertError);
      return respond({ ok: false, code: 'UPSERT_FAILED', message: 'Erro ao adicionar administrador' });
    }

    // Audit log
    const requestHash = sha256Hex(`add-admin:${email}:${targetLevel}:${Date.now()}`);
    await adminClient.from('admin_audit_logs').insert({
      actor_user_id: callerUser.id,
      action: 'admin_add',
      request_hash: requestHash,
      details: { target_email: email, level: targetLevel, created_user: !targetUser ? true : false },
    });

    console.log(`[admin-add-user] Successfully added ${email} as ${targetLevel}`);

    return respond({
      ok: true,
      code: 'SUCCESS',
      message: `${email} adicionado como administrador (${targetLevel})`,
      data: { user_id: targetUser.id, level: targetLevel },
    });

  } catch (error) {
    console.error('Unexpected error in admin-add-user:', error);
    return respond({ ok: false, code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' });
  }
});
