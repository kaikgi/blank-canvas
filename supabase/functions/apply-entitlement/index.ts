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

        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const email = user.email;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Usuário sem e-mail.' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 1) Find active entitlement for this email
        const { data: entitlement, error: entError } = await adminClient
            .from('entitlements')
            .select('*')
            .eq('email', email)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (entError) {
            console.error('[APPLY-ENTITLEMENT] Error fetching entitlement:', entError);
            throw entError;
        }

        if (!entitlement) {
            console.log(`[APPLY-ENTITLEMENT] No active entitlement for ${email}`);
            return new Response(JSON.stringify({ applied: false, reason: 'no_entitlement' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2) Find establishment owned by user
        let { data: establishment, error: estError } = await adminClient
            .from('establishments')
            .select('id, status, plano')
            .eq('owner_user_id', user.id)
            .maybeSingle();

        if (estError) throw estError;

        if (!establishment) {
            console.log(`[APPLY-ENTITLEMENT] Creating new establishment for ${email}`);

            const companyName = user.user_metadata?.company_name || `Empresa de ${user.user_metadata?.full_name?.split(' ')[0] || email.split('@')[0]}`;

            let slugBase = companyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
            if (!slugBase) slugBase = 'loja';
            let finalSlug = slugBase;
            let counter = 1;
            while (true) {
                const { data: existing } = await adminClient.from('establishments').select('id').eq('slug', finalSlug).maybeSingle();
                if (!existing) break;
                finalSlug = `${slugBase}-${counter}`;
                counter++;
            }

            const { data: newEst, error: insertError } = await adminClient.from('establishments').insert({
                owner_user_id: user.id,
                name: companyName,
                slug: finalSlug,
                status: 'pending',
                plano: 'nenhum',
            }).select('id, status, plano').single();

            if (insertError) {
                console.error('[APPLY-ENTITLEMENT] Error creating establishment:', insertError);
                throw insertError;
            }

            establishment = newEst;

            // Seed dependencies
            await adminClient.from('establishment_members').insert({
                establishment_id: establishment.id,
                user_id: user.id,
                role: 'owner',
            });

            const defaultHours = [];
            for (let weekday = 1; weekday <= 6; weekday++) {
                defaultHours.push({
                    establishment_id: establishment.id,
                    weekday,
                    open_time: '09:00',
                    close_time: '18:00',
                    closed: false,
                });
            }
            defaultHours.push({
                establishment_id: establishment.id,
                weekday: 0,
                open_time: null,
                close_time: null,
                closed: true,
            });
            await adminClient.from('business_hours').insert(defaultHours);

            console.log(`[APPLY-ENTITLEMENT] Establishment created: ${finalSlug}`);
        }

        const planCode = entitlement.plan || 'solo';
        const periodStart = entitlement.current_period_start || new Date().toISOString();
        const periodEnd = entitlement.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // 3) Upsert user's subscription
        const { data: existingSub } = await adminClient
            .from('subscriptions')
            .select('id')
            .eq('owner_user_id', user.id)
            .maybeSingle();

        if (existingSub) {
            await adminClient.from('subscriptions').update({
                plan_code: planCode,
                status: 'active',
                current_period_start: periodStart,
                current_period_end: periodEnd,
                updated_at: new Date().toISOString(),
            }).eq('id', existingSub.id);
        } else {
            await adminClient.from('subscriptions').insert({
                owner_user_id: user.id,
                plan_code: planCode,
                status: 'active',
                current_period_start: periodStart,
                current_period_end: periodEnd,
                provider: entitlement.provider || 'kiwify',
            });
        }

        // 4) Ensure establishment is active with the right plan
        await adminClient.from('establishments').update({
            status: 'active',
            plano: planCode,
        }).eq('id', establishment.id);

        console.log(`[APPLY-ENTITLEMENT] ✅ Successfully applied ${planCode} to ${email}`);

        return new Response(JSON.stringify({ applied: true, plan: planCode, end: periodEnd }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[APPLY-ENTITLEMENT] Internal Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
            status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
