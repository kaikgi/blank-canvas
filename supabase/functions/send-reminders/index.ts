import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Send email via Resend API
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

function getReminderEmailHtml(appointment: {
  customer_name: string;
  customer_email: string;
  professional_name: string;
  service_name: string;
  service_duration: number;
  establishment_name: string;
  establishment_phone: string | null;
  establishment_address: string | null;
  establishment_slug: string;
  start_at: string;
  reminder_hours: number;
}): string {
  const baseUrl = `https://www.agendali.online/${appointment.establishment_slug}`;
  const hoursText = appointment.reminder_hours === 1 ? '1 hora' : `${appointment.reminder_hours} horas`;
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #f59e0b;">⏰ Lembrete de Agendamento</h1>
      <p>Olá, <strong>${appointment.customer_name}</strong>!</p>
      <p>Este é um lembrete do seu agendamento <strong>em ${hoursText}</strong> em <strong>${appointment.establishment_name}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Detalhes do Agendamento</h3>
        <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${formatDate(appointment.start_at)}</p>
        <p style="margin: 5px 0;"><strong>🕐 Horário:</strong> ${formatTime(appointment.start_at)}</p>
        <p style="margin: 5px 0;"><strong>💇 Serviço:</strong> ${appointment.service_name} (${appointment.service_duration} min)</p>
        <p style="margin: 5px 0;"><strong>👤 Profissional:</strong> ${appointment.professional_name}</p>
        ${appointment.establishment_address ? `<p style="margin: 5px 0;"><strong>📍 Local:</strong> ${appointment.establishment_address}</p>` : ''}
        ${appointment.establishment_phone ? `<p style="margin: 5px 0;"><strong>📞 Telefone:</strong> ${appointment.establishment_phone}</p>` : ''}
      </div>
      
      <p style="background-color: #fef3c7; padding: 15px; border-radius: 8px; color: #92400e;">
        <strong>⚠️ Importante:</strong> Caso não possa comparecer, por favor avise com antecedência.
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>Este email foi enviado por ${appointment.establishment_name} através do Agendali.</p>
        <p><a href="${baseUrl}" style="color: #7c3aed;">Agendar outro horário</a></p>
      </div>
    </div>
  `;
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

    const now = new Date();

    // Get all establishments with their reminder settings
    const { data: establishments, error: estError } = await supabase
      .from("establishments")
      .select("id, reminder_hours_before")
      .gt("reminder_hours_before", 0); // Only establishments with reminders enabled

    if (estError) {
      console.error("Error fetching establishments:", estError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch establishments" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${establishments?.length || 0} establishments with reminders enabled`);

    // Group establishments by reminder hours to minimize queries
    const hourGroups = new Map<number, string[]>();
    for (const est of establishments || []) {
      const hours = est.reminder_hours_before;
      if (!hourGroups.has(hours)) {
        hourGroups.set(hours, []);
      }
      hourGroups.get(hours)!.push(est.id);
    }

    // Fetch appointments for each time window
    const allAppointments: Array<{
      id: string;
      start_at: string;
      reminder_hours: number;
      customer: { name: string; email: string | null; phone: string };
      professional: { name: string };
      service: { name: string; duration_minutes: number };
      establishment: { name: string; phone: string | null; address: string | null; slug: string };
    }> = [];

    for (const [hours, establishmentIds] of hourGroups) {
      // Calculate time window for this reminder setting (±30 min to account for cron timing)
      const startWindow = new Date(now.getTime() + (hours - 0.5) * 60 * 60 * 1000);
      const endWindow = new Date(now.getTime() + (hours + 0.5) * 60 * 60 * 1000);

      console.log(`Looking for appointments ${hours}h before: ${startWindow.toISOString()} to ${endWindow.toISOString()}`);

      const { data: appointments, error: fetchError } = await supabase
        .from("appointments")
        .select(`
          id,
          start_at,
          customer:customers(name, email, phone),
          professional:professionals(name),
          service:services(name, duration_minutes),
          establishment:establishments(name, phone, address, slug)
        `)
        .in("establishment_id", establishmentIds)
        .gte("start_at", startWindow.toISOString())
        .lte("start_at", endWindow.toISOString())
        .in("status", ["booked", "confirmed"]);

      if (fetchError) {
        console.error(`Error fetching appointments for ${hours}h window:`, fetchError);
        continue;
      }

      for (const apt of appointments || []) {
        allAppointments.push({
          ...apt,
          reminder_hours: hours,
          customer: apt.customer as unknown as { name: string; email: string | null; phone: string },
          professional: apt.professional as unknown as { name: string },
          service: apt.service as unknown as { name: string; duration_minutes: number },
          establishment: apt.establishment as unknown as { name: string; phone: string | null; address: string | null; slug: string },
        });
      }
    }

    console.log(`Found ${allAppointments.length} appointments to send reminders`);

    const results = {
      total: allAppointments.length,
      sent: 0,
      skipped: 0,
      failed: 0,
      details: [] as { appointmentId: string; status: string; reason?: string }[],
    };

    // Send reminders for each appointment
    for (const appointment of allAppointments) {
      const { customer, professional, service, establishment, reminder_hours } = appointment;

      // Skip if no email
      if (!customer?.email) {
        results.skipped++;
        results.details.push({
          appointmentId: appointment.id,
          status: "skipped",
          reason: "No customer email",
        });
        continue;
      }

      try {
        const fromAddress = `${establishment.name} <noreply@agendali.online>`;
        const hoursText = reminder_hours === 1 ? 'em 1 hora' : `em ${reminder_hours} horas`;
        const emailHtml = getReminderEmailHtml({
          customer_name: customer.name,
          customer_email: customer.email,
          professional_name: professional.name,
          service_name: service.name,
          service_duration: service.duration_minutes,
          establishment_name: establishment.name,
          establishment_phone: establishment.phone,
          establishment_address: establishment.address,
          establishment_slug: establishment.slug,
          start_at: appointment.start_at,
          reminder_hours: reminder_hours,
        });

        await sendEmail(
          customer.email,
          `⏰ Lembrete: Agendamento ${hoursText} - ${establishment.name}`,
          emailHtml,
          fromAddress
        );

        results.sent++;
        results.details.push({
          appointmentId: appointment.id,
          status: "sent",
        });

        console.log(`Reminder sent for appointment ${appointment.id} to ${customer.email}`);
      } catch (emailError) {
        console.error(`Failed to send reminder for ${appointment.id}:`, emailError);
        results.failed++;
        results.details.push({
          appointmentId: appointment.id,
          status: "failed",
          reason: emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    console.log(`Reminder job completed: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
