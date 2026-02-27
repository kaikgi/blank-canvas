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
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check admin access - look for user in admin_users table
    const { data: adminRow } = await adminClient
      .from('admin_users')
      .select('id')
      .eq('id', user.id as any)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

      // Count trial expired separately
      const { data: trialEstablishments } = await adminClient
        .from('establishments')
        .select('trial_ends_at')
        .eq('status', 'trial');

      let trialActive = 0;
      let trialExpired = 0;
      const now = new Date();
      (trialEstablishments || []).forEach((e: any) => {
        if (e.trial_ends_at && new Date(e.trial_ends_at) < now) {
          trialExpired++;
        } else {
          trialActive++;
        }
      });

      const { count: totalCustomers } = await adminClient
        .from('customers')
        .select('id', { count: 'exact', head: true });

      const { count: activeSubscriptions } = await adminClient
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Recent establishments
      const { data: recent } = await adminClient
        .from('establishments')
        .select('id, name, slug, status, created_at, owner_user_id, trial_ends_at')
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
        trial_active: trialActive,
        trial_expired: trialExpired,
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
        .select('id, name, slug, status, plano, created_at, owner_user_id, trial_ends_at, booking_enabled')
        .order('created_at', { ascending: false })
        .limit(200);

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data: establishments, error: estError } = await query;
      if (estError) throw estError;

      // Enrich with owner email, subscription, professionals count
      const enriched = [];
      for (const est of (establishments || [])) {
        // Owner email
        const { data: authUser } = await adminClient.auth.admin.getUserById(est.owner_user_id);
        
        // Active subscription
        const { data: subs } = await adminClient
          .from('subscriptions')
          .select('plan_code, status')
          .eq('owner_user_id', est.owner_user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Professionals count
        const { count: profCount } = await adminClient
          .from('professionals')
          .select('id', { count: 'exact', head: true })
          .eq('establishment_id', est.id);

        enriched.push({
          ...est,
          owner_email: authUser?.user?.email || 'N/A',
          subscription: subs?.[0] || null,
          professionals_count: profCount || 0,
        });
      }

      return new Response(JSON.stringify({
        establishments: enriched,
        total: enriched.length,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ---- ACTION: update_establishment ----
    if (action === 'update_establishment') {
      const { establishment_id, status, plano, trial_ends_at } = params;
      if (!establishment_id) {
        return new Response(JSON.stringify({ error: 'establishment_id obrigatório' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updateData: Record<string, any> = {};
      if (status !== undefined) updateData.status = status;
      if (plano !== undefined) updateData.plano = plano;
      if (trial_ends_at !== undefined) updateData.trial_ends_at = trial_ends_at;

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

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-data:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
