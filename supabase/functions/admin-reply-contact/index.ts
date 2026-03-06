import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  message_id: string;
  reply_text?: string;
  status: 'replied' | 'closed';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // Get the Authorization header to identify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's token to verify they are admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      console.error('Error getting caller user:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if caller is admin
    const { data: isAdmin, error: adminError } = await adminClient.rpc('is_admin', {
      p_user_id: callerUser.id
    });

    if (adminError || !isAdmin) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem executar esta ação.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { message_id, reply_text, status }: RequestBody = await req.json();
    
    if (!message_id || !status) {
      return new Response(
        JSON.stringify({ error: 'message_id e status são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[admin-reply-contact] Admin ${callerUser.email} updating message ${message_id} to ${status}`);

    // Get the message first
    const { data: message, error: msgError } = await adminClient
      .from('contact_messages')
      .select('*')
      .eq('id', message_id)
      .single();

    if (msgError || !message) {
      console.error('Error fetching message:', msgError);
      return new Response(
        JSON.stringify({ error: 'Mensagem não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the message
    const updateData: Record<string, unknown> = {
      status,
      replied_by: callerUser.id,
    };

    if (reply_text) {
      updateData.admin_reply = reply_text;
      updateData.replied_at = new Date().toISOString();
    }

    const { error: updateError } = await adminClient
      .from('contact_messages')
      .update(updateData)
      .eq('id', message_id);

    if (updateError) {
      console.error('Error updating message:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar mensagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email reply if we have a reply text and Resend API key
    if (reply_text && resendApiKey && status === 'replied') {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Agendali <contato@agendali.online>',
            to: [message.email],
            subject: `Re: Sua mensagem para o Agendali`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Olá, ${message.name}!</h2>
                <p>Recebemos sua mensagem e aqui está nossa resposta:</p>
                <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="color: #666; font-style: italic; margin-bottom: 8px;">Sua mensagem original:</p>
                  <p style="color: #333;">${message.message}</p>
                </div>
                <div style="background-color: #e8f4ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="color: #666; font-style: italic; margin-bottom: 8px;">Nossa resposta:</p>
                  <p style="color: #333;">${reply_text}</p>
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 24px;">
                  Atenciosamente,<br/>
                  Equipe Agendali
                </p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send reply email:', await emailResponse.text());
        } else {
          console.log(`[admin-reply-contact] Email sent to ${message.email}`);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    }

    console.log(`[admin-reply-contact] Successfully updated message ${message_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: status === 'replied' ? 'Resposta enviada com sucesso' : 'Mensagem fechada',
        email_sent: !!reply_text && !!resendApiKey
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin-reply-contact:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
