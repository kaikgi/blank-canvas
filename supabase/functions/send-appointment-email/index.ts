import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple Resend API call function
async function sendEmail(to: string, subject: string, html: string, from: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
  
  return response.json();
}

interface EmailRequest {
  type: "confirmation" | "reminder" | "cancellation" | "reschedule";
  appointmentId: string;
}

interface AppointmentData {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  customer_notes: string | null;
  customer: {
    name: string;
    email: string | null;
    phone: string;
  };
  professional: {
    name: string;
  };
  service: {
    name: string;
    duration_minutes: number;
  };
  establishment: {
    name: string;
    phone: string | null;
    address: string | null;
    slug: string;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEmailSubject(type: EmailRequest['type'], establishmentName: string): string {
  switch (type) {
    case 'confirmation':
      return `✅ Agendamento confirmado - ${establishmentName}`;
    case 'reminder':
      return `⏰ Lembrete de agendamento - ${establishmentName}`;
    case 'cancellation':
      return `❌ Agendamento cancelado - ${establishmentName}`;
    case 'reschedule':
      return `🔄 Agendamento reagendado - ${establishmentName}`;
    default:
      return `Atualização de agendamento - ${establishmentName}`;
  }
}

function getEmailHtml(type: EmailRequest['type'], data: AppointmentData): string {
  const { customer, professional, service, establishment, start_at } = data;
  const baseUrl = `https://www.agendali.online/${establishment.slug}`;
  
  const appointmentDetails = `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Detalhes do Agendamento</h3>
      <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${formatDate(start_at)}</p>
      <p style="margin: 5px 0;"><strong>🕐 Horário:</strong> ${formatTime(start_at)}</p>
      <p style="margin: 5px 0;"><strong>💇 Serviço:</strong> ${service.name} (${service.duration_minutes} min)</p>
      <p style="margin: 5px 0;"><strong>👤 Profissional:</strong> ${professional.name}</p>
      ${establishment.address ? `<p style="margin: 5px 0;"><strong>📍 Local:</strong> ${establishment.address}</p>` : ''}
      ${establishment.phone ? `<p style="margin: 5px 0;"><strong>📞 Telefone:</strong> ${establishment.phone}</p>` : ''}
    </div>
  `;

  const footer = `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
      <p>Este email foi enviado por ${establishment.name} através do Agendali.</p>
      <p><a href="${baseUrl}" style="color: #7c3aed;">Agendar outro horário</a></p>
    </div>
  `;

  switch (type) {
    case 'confirmation':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">✅ Agendamento Confirmado!</h1>
          <p>Olá, <strong>${customer.name}</strong>!</p>
          <p>Seu agendamento em <strong>${establishment.name}</strong> foi confirmado com sucesso.</p>
          ${appointmentDetails}
          <p style="color: #666;">Caso precise reagendar ou cancelar, acesse sua área de agendamentos.</p>
          ${footer}
        </div>
      `;

    case 'reminder':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">⏰ Lembrete de Agendamento</h1>
          <p>Olá, <strong>${customer.name}</strong>!</p>
          <p>Este é um lembrete do seu agendamento em <strong>${establishment.name}</strong>.</p>
          ${appointmentDetails}
          <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; color: #92400e;">
            <strong>⚠️ Importante:</strong> Caso não possa comparecer, por favor avise com antecedência.
          </p>
          ${footer}
        </div>
      `;

    case 'cancellation':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">❌ Agendamento Cancelado</h1>
          <p>Olá, <strong>${customer.name}</strong>!</p>
          <p>Seu agendamento em <strong>${establishment.name}</strong> foi cancelado.</p>
          ${appointmentDetails}
          <p style="margin-top: 20px;">
            <a href="${baseUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Agendar novo horário
            </a>
          </p>
          ${footer}
        </div>
      `;

    case 'reschedule':
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">🔄 Agendamento Reagendado</h1>
          <p>Olá, <strong>${customer.name}</strong>!</p>
          <p>Seu agendamento em <strong>${establishment.name}</strong> foi reagendado para uma nova data.</p>
          ${appointmentDetails}
          <p style="color: #666;">Caso precise de mais alterações, acesse sua área de agendamentos.</p>
          ${footer}
        </div>
      `;

    default:
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Atualização de Agendamento</h1>
          <p>Olá, <strong>${customer.name}</strong>!</p>
          <p>Houve uma atualização no seu agendamento em <strong>${establishment.name}</strong>.</p>
          ${appointmentDetails}
          ${footer}
        </div>
      `;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, appointmentId }: EmailRequest = await req.json();

    if (!type || !appointmentId) {
      return new Response(
        JSON.stringify({ error: "Missing type or appointmentId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch appointment with related data
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        id,
        start_at,
        end_at,
        status,
        customer_notes,
        customer:customers(name, email, phone),
        professional:professionals(name),
        service:services(name, duration_minutes),
        establishment:establishments(name, phone, address, slug)
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error("Error fetching appointment:", fetchError);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Transform to expected format
    const appointmentData: AppointmentData = {
      id: appointment.id,
      start_at: appointment.start_at,
      end_at: appointment.end_at,
      status: appointment.status,
      customer_notes: appointment.customer_notes,
      customer: appointment.customer as unknown as AppointmentData['customer'],
      professional: appointment.professional as unknown as AppointmentData['professional'],
      service: appointment.service as unknown as AppointmentData['service'],
      establishment: appointment.establishment as unknown as AppointmentData['establishment'],
    };

    // Check if customer has email
    if (!appointmentData.customer?.email) {
      console.log("Customer has no email, skipping notification");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No customer email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email
    const fromAddress = `${appointmentData.establishment.name} <noreply@agendali.online>`;
    const emailResponse = await sendEmail(
      appointmentData.customer.email,
      getEmailSubject(type, appointmentData.establishment.name),
      getEmailHtml(type, appointmentData),
      fromAddress
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-appointment-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
