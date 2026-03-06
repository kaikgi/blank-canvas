import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SEMPRE retornar HTTP 200! Supabase lança 'non-2xx status code' e esconde o 'error' se usarmos 400/500
  const respond = (body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond({ error: "Autenticação ausente" });

    // Verify caller
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return respond({ error: "Sessão inválida" });

    // Check admin
    const adminClient = createClient(url, serviceKey);
    const { data: adminRow } = await adminClient
      .from("admin_users")
      .select("id, level")
      .eq("user_id", user.id)
      .single();

    if (!adminRow || adminRow.level !== "master") {
      return respond({ error: "Acesso negado: Requer nível de admin master" });
    }

    // Parse body
    const payload = await req.json();
    const establishment_id = payload.establishment_id;
    const delete_auth_user = payload.delete_auth_user || false;
    const delete_storage_files = payload.delete_storage_files || false;

    if (!establishment_id) {
      return respond({ error: "O ID do estabelecimento (establishment_id) é obrigatório." });
    }

    if (establishment_id.startsWith('pending-')) {
      const pendingUserId = establishment_id.replace('pending-', '');
      if (delete_auth_user) {
        await adminClient.from("profiles").delete().eq("id", pendingUserId);
        const { error: authErr } = await adminClient.auth.admin.deleteUser(pendingUserId);
        if (authErr) {
          return respond({ error: `Erro exclusão Auth: ${authErr.message}` });
        }
        return respond({ success: true, steps: ["auth_user: excluído (pendente)"] });
      }
      return respond({ success: true, steps: ["establishment: none to delete"] });
    }

    // Fetch establishment
    const { data: est, error: estErr } = await adminClient
      .from("establishments")
      .select("id, name, slug, owner_user_id")
      .eq("id", establishment_id)
      .single();

    if (estErr || !est) {
      return respond({ error: `Estabelecimento não encontrado: ${establishment_id}` });
    }

    // Verify owner email for related data cleanup
    let ownerEmail: string | null = null;
    if (est.owner_user_id) {
      const { data: ownerUser } = await adminClient.auth.admin.getUserById(est.owner_user_id);
      if (ownerUser && ownerUser.user) {
        ownerEmail = ownerUser.user.email || null;
      }
    }

    // Create a deletion job record
    const { data: job } = await adminClient
      .from("establishment_deletion_jobs")
      .insert({
        establishment_id: est.id,
        owner_user_id: est.owner_user_id,
        requested_by_admin_user_id: user.id,
        status: "running",
      })
      .select("id")
      .single();

    const steps: string[] = [];

    try {
      // 1. Delete ratings
      const { count: ratingsCount, error: err1 } = await adminClient
        .from("ratings")
        .delete({ count: "exact" })
        .eq("establishment_id", est.id);
      if (err1) throw new Error(`Ratings: ${err1.message}`);
      steps.push(`ratings: ${ratingsCount ?? 0}`);

      // 2. Delete appointments
      const { count: aptsCount, error: err2 } = await adminClient
        .from("appointments")
        .delete({ count: "exact" })
        .eq("establishment_id", est.id);
      if (err2) throw new Error(`Appointments: ${err2.message}`);
      steps.push(`appointments: ${aptsCount ?? 0}`);

      // 3. Delete professional_services & hours (via professionals)
      const { data: profs } = await adminClient
        .from("professionals")
        .select("id")
        .eq("establishment_id", est.id);

      const profIds = (profs || []).map((p) => p.id);
      if (profIds.length > 0) {
        await adminClient.from("professional_services").delete().in("professional_id", profIds);
        await adminClient.from("professional_hours").delete().in("professional_id", profIds);
      }

      // 4. Delete professionals
      const { count: profsCount, error: err4 } = await adminClient
        .from("professionals")
        .delete({ count: "exact" })
        .eq("establishment_id", est.id);
      if (err4) throw new Error(`Professionals: ${err4.message}`);
      steps.push(`professionals: ${profsCount ?? 0}`);

      // 5. Delete customers
      const { count: custCount, error: err5 } = await adminClient
        .from("customers")
        .delete({ count: "exact" })
        .eq("establishment_id", est.id);
      if (err5) throw new Error(`Customers: ${err5.message}`);
      steps.push(`customers: ${custCount ?? 0}`);

      // 6. Delete services
      const { count: svcCount, error: err6 } = await adminClient
        .from("services")
        .delete({ count: "exact" })
        .eq("establishment_id", est.id);
      if (err6) throw new Error(`Services: ${err6.message}`);
      steps.push(`services: ${svcCount ?? 0}`);

      // 7. Delete business_hours
      await adminClient.from("business_hours").delete().eq("establishment_id", est.id);

      // 8. Delete time_blocks
      await adminClient.from("time_blocks").delete().eq("establishment_id", est.id);

      // 9. Delete recurring_time_blocks
      await adminClient.from("recurring_time_blocks").delete().eq("establishment_id", est.id);

      // 10. Delete establishment_members
      await adminClient.from("establishment_members").delete().eq("establishment_id", est.id);

      // 11. Delete subscriptions and events for owner (only if requested or if deleting user, but lets clear it to be safe)
      const { error: err11 } = await adminClient.from("subscriptions").delete().eq("owner_user_id", est.owner_user_id);
      if (!err11) steps.push(`subscriptions: deleted`);

      // Wipe entitlement and signups if we are completely wiping the user
      if (delete_auth_user && ownerEmail) {
        await adminClient.from("entitlements").delete().eq("email", ownerEmail);
        await adminClient.from("allowed_establishment_signups").delete().eq("email", ownerEmail);
      }

      // 12. Delete the establishment itself
      const { error: delEstErr } = await adminClient
        .from("establishments")
        .delete()
        .eq("id", est.id);

      if (delEstErr) {
        throw new Error(`Falha final ao deletar o estabelecimento na tabela: ${delEstErr.message}`);
      }
      steps.push("establishment: deleted");

      // 13. Optionally delete storage files
      if (delete_storage_files) {
        try {
          const { data: files } = await adminClient.storage
            .from("uploads")
            .list(est.id);
          if (files && files.length > 0) {
            const paths = files.map((f: any) => `${est.id}/${f.name}`);
            await adminClient.storage.from("uploads").remove(paths);
            steps.push(`storage: ${paths.length} files removed`);
          } else {
            steps.push("storage: no files");
          }
        } catch (e: any) {
          steps.push(`storage: error - ${e.message}`);
        }
      }

      // 14. Optionally delete auth user (Safe check first)
      if (delete_auth_user && est.owner_user_id) {
        try {
          // CHECK se ele não tem outros estabelecimentos
          const { data: otherEsts } = await adminClient.from("establishments").select("id").eq("owner_user_id", est.owner_user_id);

          if (otherEsts && otherEsts.length > 0) {
            steps.push(`auth_user: ignorado (usuário possui outros ${otherEsts.length} estabelecimentos ativos)`);
          } else {
            // Pode remover profile e auth.user
            await adminClient.from("profiles").delete().eq("id", est.owner_user_id);
            const { error: authErr } = await adminClient.auth.admin.deleteUser(est.owner_user_id);
            if (authErr) {
              steps.push(`auth_user: error - ${authErr.message}`);
            } else {
              steps.push("auth_user: deleted");
            }
          }
        } catch (e: any) {
          steps.push(`auth_user: error - ${e.message}`);
        }
      }

      // Update job status
      if (job) {
        await adminClient
          .from("establishment_deletion_jobs")
          .update({ status: "done", completed_at: new Date().toISOString() })
          .eq("id", job.id);
      }

      // Audit log
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.id,
        action: "establishment.delete",
        target_establishment_id: est.id,
        target_owner_user_id: est.owner_user_id,
        metadata: { name: est.name, slug: est.slug, steps, delete_auth_user, delete_storage_files },
      });

      return respond({ success: true, steps, message: "Estabelecimento excluído com sucesso!" });
    } catch (err: any) {
      console.log(`[DELETE JOB ERROR] Est: ${est.id} | Step failure: ${err.message}`);
      // Update job with error
      if (job) {
        await adminClient
          .from("establishment_deletion_jobs")
          .update({
            status: "failed",
            error: err.message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
      return respond({ error: `Erro na exclusão. Parada de segurança acionada: ${err.message}` });
    }
  } catch (err: any) {
    console.error("admin-delete-establishment error:", err);
    return respond({ error: err.message || "Erro interno no servidor de exclusão" });
  }
});
