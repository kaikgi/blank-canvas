import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado: token ausente' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado: token inválido' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin access - look for user in admin_users table
    const { data: adminRow } = await adminClient
      .from('admin_users')
      .select('id, level')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'Acesso negado: você não é um administrador' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, ...params } = await req.json();

    // ---- ACTION: stats ----
    if (action === 'stats') {
      const { count: totalEst } = await adminClient
        .from('establishments')
        .select('id', { count: 'exact', head: true });

      const { data: statusCounts } = await adminClient
        .from('establishments')
        .select('status');

      const byStatus: Record<string, number> = {};
      (statusCounts || []).forEach((e: any) => {
        byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      });



      const { count: totalCustomers } = await adminClient
        .from('customers')
        .select('id', { count: 'exact', head: true });

      const { count: activeSubscriptions } = await adminClient
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: recent } = await adminClient
        .from('establishments')
        .select('id, name, slug, status, created_at, owner_user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get owner emails
      const recentWithEmails = [];
      for (const est of (recent || [])) {
        const { data: authUser } = await adminClient.auth.admin.getUserById(est.owner_user_id);
        recentWithEmails.push({
          ...est,
          owner_email: authUser?.user?.email || 'N/A',
        });
      }

      return new Response(JSON.stringify({
        total_establishments: totalEst || 0,
        total_customers: totalCustomers || 0,
        active_subscriptions: activeSubscriptions || 0,
        by_status: byStatus,
        recent_establishments: recentWithEmails,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- ACTION: list_establishments ----
    if (action === 'list_establishments') {
      const search = params.search || '';

      let query = adminClient
        .from('establishments')
        .select('id, name, slug, status, plano, created_at, owner_user_id, booking_enabled')
        .order('created_at', { ascending: false })
        .limit(200);

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data: establishments, error: estError } = await query;
      if (estError) throw estError;

      // Bring all users to check pending ones
      const { data: authResp } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const allAuthUsers = authResp?.users || [];

      // Enrich with owner email, subscription, professionals count
      const enriched = [];
      const userIdsWithEst = new Set();

      for (const est of (establishments || [])) {
        userIdsWithEst.add(est.owner_user_id);

        // Owner email
        const authUser = allAuthUsers.find(u => u.id === est.owner_user_id);
        const ownerEmail = authUser?.email || 'N/A';

        // Active subscription
        const { data: subs } = await adminClient
          .from('subscriptions')
          .select('plan_code, status, current_period_end')
          .eq('owner_user_id', est.owner_user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Active entitlement
        let billing_cycle = null;
        if (ownerEmail !== 'N/A') {
          const { data: ent } = await adminClient
            .from('entitlements')
            .select('billing_cycle')
            .eq('email', ownerEmail)
            .eq('status', 'active')
            .maybeSingle();
          if (ent) billing_cycle = ent.billing_cycle;
        }

        // Professionals count
        const { count: profCount } = await adminClient
          .from('professionals')
          .select('id', { count: 'exact', head: true })
          .eq('establishment_id', est.id);

        enriched.push({
          ...est,
          owner_email: ownerEmail,
          subscription: subs?.[0] ? { ...subs[0], billing_cycle } : null,
          professionals_count: profCount || 0,
        });
      }

      // Also add users who registered (have company_name) but don't have an establishment yet (e.g. unverified email)
      const pendingUsers = allAuthUsers.filter(u => !userIdsWithEst.has(u.id) && u.user_metadata?.company_name);

      for (const u of pendingUsers) {
        const cName = u.user_metadata.company_name;
        const email = u.email || '';

        if (search) {
          const s = search.toLowerCase();
          if (!cName.toLowerCase().includes(s) && !email.toLowerCase().includes(s)) {
            continue;
          }
        }

        enriched.push({
          id: `pending-${u.id}`,
          name: cName,
          slug: 'pendente',
          status: 'pending',
          plano: 'nenhum',
          created_at: u.created_at,
          owner_user_id: u.id,
          booking_enabled: false,
          owner_email: email,
          subscription: null,
          professionals_count: 0,
        });
      }

      // Sort combinations by created_at desc
      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return new Response(JSON.stringify({
        establishments: enriched,
        total: enriched.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- ACTION: update_establishment ----
    if (action === 'update_establishment') {
      const { establishment_id, status, plano } = params;
      if (!establishment_id) {
        return new Response(JSON.stringify({ error: 'establishment_id obrigatório' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updateData: Record<string, any> = {};
      if (status !== undefined) updateData.status = status;
      if (plano !== undefined) updateData.plano = plano;

      const { error: updateError } = await adminClient
        .from('establishments')
        .update(updateData)
        .eq('id', establishment_id);

      if (updateError) throw updateError;

      // If setting to active with a plan, also create/update subscription
      if (status === 'active' && plano) {
        const { data: est } = await adminClient
          .from('establishments')
          .select('owner_user_id')
          .eq('id', establishment_id)
          .single();

        if (est) {
          const { data: existingSub } = await adminClient
            .from('subscriptions')
            .select('id')
            .eq('owner_user_id', est.owner_user_id)
            .maybeSingle();

          if (existingSub) {
            await adminClient.from('subscriptions').update({
              plan_code: plano,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('owner_user_id', est.owner_user_id);
          } else {
            await adminClient.from('subscriptions').insert({
              owner_user_id: est.owner_user_id,
              plan_code: plano,
              status: 'active',
              provider: 'admin',
            });
          }
        }
      }

      console.log(`[admin-data] Admin ${user.email} updated establishment ${establishment_id}:`, updateData);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- ACTION: sync_entitlement ----
    if (action === 'sync_entitlement') {
      const { establishment_id, owner_email } = params;
      if (!establishment_id || !owner_email || owner_email === 'N/A') {
        return new Response(JSON.stringify({ error: 'E-mail do dono ou ID não fornecidos' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: ent } = await adminClient
        .from('entitlements')
        .select('*')
        .eq('email', owner_email)
        .eq('status', 'active')
        .maybeSingle();

      if (!ent) {
        return new Response(JSON.stringify({ error: 'Nenhum entitlement (compra válida na Kiwify) ativo encontrado para esse e-mail.' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Sync the establishment
      const { data: est, error: estError } = await adminClient
        .from('establishments')
        .update({
          status: 'active',
          plano: ent.plan,
        })
        .eq('id', establishment_id)
        .select('owner_user_id')
        .single();

      if (estError) throw estError;

      // Sync the subscription
      const { data: existingSub } = await adminClient
        .from('subscriptions')
        .select('id')
        .eq('owner_user_id', est.owner_user_id)
        .maybeSingle();

      const subData = {
        plan_code: ent.plan,
        status: 'active',
        billing_cycle: ent.billing_cycle,
        current_period_start: ent.current_period_start || new Date().toISOString(),
        current_period_end: ent.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        provider: 'kiwify',
        provider_ref: ent.provider_ref,
        updated_at: new Date().toISOString(),
      };

      if (existingSub) {
        await adminClient.from('subscriptions').update(subData).eq('id', existingSub.id);
      } else {
        await adminClient.from('subscriptions').insert({
          ...subData,
          owner_user_id: est.owner_user_id,
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'Plano sincronizado via Kiwify com sucesso!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- ACTION: create_establishment ----
    if (action === 'create_establishment') {
      const { name, slug, owner_email, owner_user_id } = params;
      if (!name) {
        return new Response(JSON.stringify({ error: 'O nome é obrigatório' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Generate a basic slug if not provided
      let finalSlug = slug;
      if (!finalSlug || finalSlug.trim() === '') {
        finalSlug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        finalSlug = `${finalSlug}-${uniqueSuffix}`;
      } else {
        // Enforce basic formatting on provided slug
        finalSlug = finalSlug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      let targetUserId = owner_user_id;
      let usedEmail = owner_email;

      if (!targetUserId && usedEmail) {
        // Find user by email
        const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers();
        let foundUser = (!usersErr && usersData?.users) ? usersData.users.find(u => u.email === usedEmail) : null;

        if (foundUser) {
          targetUserId = foundUser.id;
        } else {
          // Criar auth user se não existir para vincular os dados
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: usedEmail,
            email_confirm: true,
            password: crypto.randomUUID().slice(0, 10) + 'A1!',
            user_metadata: { company_name: name, created_via_admin: true }
          });
          if (!createError && newUser?.user) {
            targetUserId = newUser.user.id;
          }
        }
      }

      if (!targetUserId) {
        // Fallback: se não quiser e-mail nem ID, atrela ao admin (não recomendado, mas mantém legado)
        targetUserId = user.id;
        usedEmail = user.email || '';
      }

      // Verificação automática de entitlement (assinatura)
      let initialStatus = 'pending';
      let initialPlan = 'solo';
      let activeEntitlement = null;

      if (usedEmail && usedEmail !== 'N/A') {
        const { data: ent } = await adminClient.from('entitlements')
          .select('*')
          .eq('email', usedEmail)
          .eq('status', 'active')
          .maybeSingle();

        if (ent) {
          activeEntitlement = ent;
          initialStatus = 'active';
          initialPlan = ent.plan;
        }
      }

      const { data: newEst, error: insertError } = await adminClient
        .from('establishments')
        .insert({
          name,
          slug: finalSlug,
          owner_user_id: targetUserId,
          status: initialStatus,
          plano: initialPlan,
          booking_enabled: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Se houver entitlement, já cria a assinatura atrelada ao targetUserId
      if (activeEntitlement) {
        await adminClient.from('subscriptions').insert({
          owner_user_id: targetUserId,
          plan_code: activeEntitlement.plan,
          status: 'active',
          billing_cycle: activeEntitlement.billing_cycle,
          current_period_start: activeEntitlement.current_period_start || new Date().toISOString(),
          current_period_end: activeEntitlement.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          provider: 'kiwify',
          provider_ref: activeEntitlement.provider_ref,
        });
      }

      return new Response(JSON.stringify({ success: true, establishment: newEst }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- ACTION: list_subscriptions ----
    if (action === 'list_subscriptions') {
      const search = params.search || '';

      let query = adminClient
        .from('entitlements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike('email', `%${search}%`);
      }

      const { data: entitlements, error: entError } = await query;
      if (entError) throw entError;

      return new Response(JSON.stringify({ success: true, entitlements }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in admin-data:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
