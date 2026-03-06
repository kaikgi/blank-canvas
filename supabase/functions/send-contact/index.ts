import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { name, email, message }: ContactRequest = await req.json();

    // Validate input
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Nome, email e mensagem são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const { data: contactMessage, error: dbError } = await supabase
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        status: "new",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar mensagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Contact message saved:", contactMessage.id);

    // Send notification email to admin
    let emailSent = false;
    if (resendApiKey) {
      try {
        const adminEmailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Agendali <noreply@agendali.online>",
            to: ["contato@agendali.online"],
            subject: `[Agendali] Nova mensagem de contato: ${name}`,
            html: `
              <h2>Nova mensagem de contato</h2>
              <p><strong>Nome:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Mensagem:</strong></p>
              <p>${message.replace(/\n/g, "<br>")}</p>
              <hr>
              <p><small>Recebido em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</small></p>
            `,
          }),
        });

        if (adminEmailResponse.ok) {
          console.log("Admin notification email sent");
          emailSent = true;
        } else {
          const errorData = await adminEmailResponse.text();
          console.error("Failed to send admin email:", errorData);
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      // Send auto-reply to user
      try {
        const userEmailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Agendali <noreply@agendali.online>",
            to: [email],
            subject: "Recebemos sua mensagem - Agendali",
            html: `
              <h2>Olá, ${name}!</h2>
              <p>Recebemos sua mensagem e agradecemos por entrar em contato conosco.</p>
              <p>Nossa equipe irá analisar sua solicitação e responderá em até 24 horas úteis.</p>
              <br>
              <p><strong>Sua mensagem:</strong></p>
              <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #4F46E5;">
                ${message.replace(/\n/g, "<br>")}
              </blockquote>
              <br>
              <p>Atenciosamente,<br>Equipe Agendali</p>
              <hr>
              <p><small>Este é um email automático. Por favor, não responda diretamente.</small></p>
            `,
          }),
        });

        if (userEmailResponse.ok) {
          console.log("Auto-reply email sent to user");
        } else {
          const errorData = await userEmailResponse.text();
          console.error("Failed to send auto-reply:", errorData);
        }
      } catch (emailError) {
        console.error("Auto-reply email error:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email notifications");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Mensagem enviada com sucesso",
        emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing contact:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
