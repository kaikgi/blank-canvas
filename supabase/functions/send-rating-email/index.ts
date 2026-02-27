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

interface RatingEmailRequest {
  ratingId: string;
}

interface RatingData {
  id: string;
  stars: number;
  comment: string | null;
  created_at: string;
  customer: {
    name: string;
  };
  appointment: {
    start_at: string;
    service: {
      name: string;
    };
    professional: {
      name: string;
    };
  };
  establishment: {
    id: string;
    name: string;
    slug: string;
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getStarsHtml(stars: number): string {
  const fullStar = '⭐';
  const emptyStar = '☆';
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += i < stars ? fullStar : emptyStar;
  }
  return html;
}

function getStarsColor(stars: number): string {
  if (stars >= 4) return '#16a34a'; // green
  if (stars >= 3) return '#f59e0b'; // yellow
  return '#dc2626'; // red
}

function getRatingEmailHtml(data: RatingData, ownerEmail: string): string {
  const { customer, appointment, establishment, stars, comment, created_at } = data;
  const starsColor = getStarsColor(stars);
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #7c3aed;">⭐ Nova Avaliação Recebida!</h1>
      <p>Olá!</p>
      <p>Um cliente deixou uma nova avaliação para <strong>${establishment.name}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${starsColor};">
        <div style="font-size: 24px; margin-bottom: 15px; letter-spacing: 2px;">
          ${getStarsHtml(stars)}
        </div>
        <p style="font-size: 20px; font-weight: bold; margin: 0 0 5px 0; color: ${starsColor};">
          ${stars}/5 estrelas
        </p>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Avaliado por <strong>${customer.name}</strong> em ${formatDate(created_at)}
        </p>
      </div>

      ${comment ? `
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px; text-transform: uppercase;">Comentário do cliente:</h3>
          <p style="margin: 0; font-style: italic; color: #374151; font-size: 16px; line-height: 1.6;">
            "${comment}"
          </p>
        </div>
      ` : ''}

      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Detalhes do atendimento avaliado:</h3>
        <p style="margin: 5px 0; color: #666;"><strong>Serviço:</strong> ${appointment.service.name}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Profissional:</strong> ${appointment.professional.name}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Data:</strong> ${formatDate(appointment.start_at)}</p>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #faf5ff; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #7c3aed; font-weight: bold;">
          ${stars >= 4 ? '🎉 Ótimo trabalho! Continue assim!' : stars >= 3 ? '💪 Bom trabalho! Há espaço para melhorar.' : '⚠️ Atenção: Esta avaliação precisa de atenção.'}
        </p>
        <a href="https://www.agendali.online/dashboard" 
           style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Ver no Painel
        </a>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>Este email foi enviado pelo Agendali - Sistema de Agendamento Online.</p>
        <p><a href="https://www.agendali.online" style="color: #7c3aed;">www.agendali.online</a></p>
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

    const { ratingId }: RatingEmailRequest = await req.json();

    if (!ratingId) {
      return new Response(
        JSON.stringify({ error: "Missing ratingId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch rating with related data
    const { data: rating, error: fetchError } = await supabase
      .from("ratings")
      .select(`
        id,
        stars,
        comment,
        created_at,
        customer:customers(name),
        appointment:appointments(
          start_at,
          service:services(name),
          professional:professionals(name)
        ),
        establishment:establishments(id, name, slug, owner_user_id)
      `)
      .eq("id", ratingId)
      .single();

    if (fetchError || !rating) {
      console.error("Error fetching rating:", fetchError);
      return new Response(
        JSON.stringify({ error: "Rating not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get establishment owner's email
    const establishment = rating.establishment as unknown as { id: string; name: string; slug: string; owner_user_id: string };
    
    const { data: ownerProfile, error: ownerError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", establishment.owner_user_id)
      .single();

    if (ownerError) {
      console.log("Could not fetch owner profile:", ownerError);
    }

    // Get owner's email from auth.users via service role
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      establishment.owner_user_id
    );

    if (authError || !authUser?.user?.email) {
      console.log("Owner has no email or error fetching:", authError);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No owner email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ownerEmail = authUser.user.email;

    // Transform rating data
    const ratingData: RatingData = {
      id: rating.id,
      stars: rating.stars,
      comment: rating.comment,
      created_at: rating.created_at,
      customer: rating.customer as unknown as RatingData['customer'],
      appointment: rating.appointment as unknown as RatingData['appointment'],
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
      },
    };

    // Send email to establishment owner
    const fromAddress = `Agendali <noreply@agendali.online>`;
    const subject = `⭐ Nova avaliação (${ratingData.stars}/5) - ${ratingData.establishment.name}`;
    
    const emailResponse = await sendEmail(
      ownerEmail,
      subject,
      getRatingEmailHtml(ratingData, ownerEmail),
      fromAddress
    );

    console.log("Rating notification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-rating-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
