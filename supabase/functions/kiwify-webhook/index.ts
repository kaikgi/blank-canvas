import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kiwify-secret, x-kiwify-token',
}

const ACTIVATION_EVENTS = new Set([
  'order_approved',
  'order_paid',
  'subscription_renewed',
  'subscription_active',
])

const CANCELLATION_EVENTS = new Set([
  'order_refunded',
  'order_chargedback',
  'subscription_canceled',
])

const PAST_DUE_EVENTS = new Set([
  'subscription_past_due',
  'subscription_payment_failed',
])

const IGNORED_EVENTS = new Set([
  'pix_created',
  'boleto_created',
  'waiting_payment',
])

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null
  return email.toLowerCase().trim()
}

const APP_URL = 'https://www.agendali.online'

interface KiwifyWebhookPayload {
  order_id?: string
  order_ref?: string
  order_status?: string
  subscription_id?: string
  payment_method?: string
  created_at?: string
  updated_at?: string
  approved_date?: string
  refunded_at?: string
  store_id?: string
  product_type?: string
  sale_type?: string
  webhook_event_type?: string
  Customer?: {
    email?: string
    full_name?: string
    first_name?: string
    mobile?: string
    CPF?: string
    [key: string]: unknown
  }
  Product?: {
    product_id?: string
    product_name?: string
  }
  Subscription?: {
    id?: string
    status?: string
    start_date?: string
    next_payment?: string
    plan?: {
      id?: string
      name?: string
      frequency?: string
      qty_charges?: number
    }
    charges?: unknown
    customer_access?: {
      has_access?: boolean
      active_period?: boolean
      access_until?: string
    }
  }
  TrackingParameters?: {
    src?: string
    s1?: string
    s2?: string
    s3?: string
    [key: string]: unknown
  }
  Commissions?: unknown
  Discount?: unknown
  customer_email?: string
  customer_name?: string
  product_id?: string
  product_name?: string
}

serve(async (req) => {
  const url = new URL(req.url)
  const method = req.method

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (method === 'GET') {
    return new Response(
      JSON.stringify({ ok: true, version: '5.0.0', message: 'Kiwify webhook ready (product-filtered)' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validate webhook secret
    const headerSecret = req.headers.get('x-kiwify-secret') || req.headers.get('x-kiwify-token')
    const queryToken = url.searchParams.get('token')
    const receivedToken = headerSecret || queryToken
    const expectedSecret = Deno.env.get('KIWIFY_WEBHOOK_SECRET')

    if (!expectedSecret) {
      console.error('[KIWIFY] KIWIFY_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Server config error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!receivedToken || receivedToken !== expectedSecret) {
      console.error('[KIWIFY] Invalid webhook token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse payload
    let payload: KiwifyWebhookPayload
    try {
      payload = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const eventType = payload.webhook_event_type || 'unknown'
    const eventId = payload.order_id || payload.subscription_id || payload.Subscription?.id || crypto.randomUUID()
    const buyerEmail = normalizeEmail(payload.Customer?.email || payload.customer_email)
    const productId = payload.Product?.product_id || payload.product_id || null
    const productName = payload.Product?.product_name || payload.product_name || ''
    const subscriptionId = payload.subscription_id || payload.Subscription?.id

    console.log(`[KIWIFY] Event: ${eventType} | Order: ${eventId} | Email: ${buyerEmail} | Product: ${productName} | ProductID: ${productId}`)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[KIWIFY] Missing Supabase credentials')
      return new Response(
        JSON.stringify({ error: 'Server config error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Idempotency: insert event
    const { data: insertedEvent, error: insertError } = await supabase
      .from('billing_webhook_events')
      .insert({
        provider: 'kiwify',
        event_id: eventId,
        event_type: eventType,
        payload: payload as unknown,
        kiwify_product_id: productId,
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`[KIWIFY] Duplicate event ${eventId}, skipping`)
        return new Response(
          JSON.stringify({ ok: true, dedup: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw insertError
    }

    // ===== PRODUCT FILTER: only process Agendali products =====
    if (IGNORED_EVENTS.has(eventType)) {
      console.log(`[KIWIFY] Event ${eventType} acknowledged, no action needed`)
      await supabase
        .from('billing_webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', insertedEvent.id)
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: 'IGNORED_EVENT_TYPE' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Look up product in kiwify_products table
    const productMatch = await findAgendaliProduct(supabase, productId, productName)

    if (!productMatch) {
      console.log(`[KIWIFY] ⚠️ Product NOT recognized as Agendali. ProductID: ${productId}, Name: ${productName}. IGNORING.`)
      await supabase
        .from('billing_webhook_events')
        .update({
          processed_at: new Date().toISOString(),
          ignored: true,
          ignore_reason: 'NOT_AGENDALI_PRODUCT',
        })
        .eq('id', insertedEvent.id)
      return new Response(
        JSON.stringify({ ok: true, ignored: true, reason: 'NOT_AGENDALI_PRODUCT' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const planCode = productMatch.plan_code
    console.log(`[KIWIFY] ✅ Agendali product matched: plan=${planCode}`)

    // Process event
    let processingError: string | null = null

    try {
      if (!buyerEmail) {
        throw new Error('No customer email found in payload')
      }
      await processKiwifyEvent(supabase, payload, eventType, buyerEmail, planCode, subscriptionId)
    } catch (err) {
      processingError = err instanceof Error ? err.message : String(err)
      console.error('[KIWIFY] Processing error:', processingError)
    }

    // Update event record
    await supabase
      .from('billing_webhook_events')
      .update({ processed_at: new Date().toISOString(), processing_error: processingError })
      .eq('id', insertedEvent.id)

    return new Response(
      JSON.stringify({ ok: true, processed: !processingError, error: processingError }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[KIWIFY] FATAL:', error instanceof Error ? error.stack : error)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Find matching Agendali product by product_id or product_name
 */
async function findAgendaliProduct(
  supabase: SupabaseClient,
  productId: string | null,
  productName: string,
): Promise<{ plan_code: string } | null> {
  // Try by kiwify_product_id first
  if (productId) {
    const { data } = await supabase
      .from('kiwify_products')
      .select('plan_code')
      .eq('kiwify_product_id', productId)
      .eq('active', true)
      .limit(1)
      .single()
    if (data) return data
  }

  // Try by product_name (partial match)
  if (productName) {
    const nameLower = productName.toLowerCase()
    const { data: allProducts } = await supabase
      .from('kiwify_products')
      .select('plan_code, product_name')
      .eq('active', true)

    if (allProducts) {
      // Check if product name contains "agendali"
      if (!nameLower.includes('agendali')) {
        return null // Not an Agendali product
      }

      // Try to match specific plan by name
      for (const p of allProducts) {
        if (p.product_name && nameLower.includes(p.product_name.toLowerCase())) {
          return { plan_code: p.plan_code }
        }
      }

      // If name contains "agendali" but no specific match, detect plan from name
      if (nameLower.includes('pro') || nameLower.includes('profissional')) return { plan_code: 'pro' }
      if (nameLower.includes('studio')) return { plan_code: 'studio' }
      if (nameLower.includes('solo') || nameLower.includes('básico') || nameLower.includes('basic') || nameLower.includes('basico')) return { plan_code: 'solo' }

      // Default to solo if it says "agendali" but no specific plan keyword
      return { plan_code: 'solo' }
    }
  }

  return null
}

async function processKiwifyEvent(
  supabase: SupabaseClient,
  payload: KiwifyWebhookPayload,
  eventType: string,
  buyerEmail: string,
  planCode: string,
  subscriptionId: string | undefined,
) {
  console.log(`[KIWIFY] Processing: plan=${planCode}, event=${eventType}`)

  let status: string
  if (ACTIVATION_EVENTS.has(eventType)) {
    status = 'active'
  } else if (PAST_DUE_EVENTS.has(eventType)) {
    status = 'past_due'
  } else if (CANCELLATION_EVENTS.has(eventType)) {
    status = 'canceled'
  } else {
    console.log(`[KIWIFY] Unknown event type "${eventType}", treating as active`)
    status = 'active'
  }

  // Calculate period dates
  const now = new Date()
  let periodStart = now
  if (payload.approved_date) {
    const parsed = new Date(payload.approved_date.replace(' ', 'T'))
    if (!isNaN(parsed.getTime())) periodStart = parsed
  } else if (payload.Subscription?.start_date) {
    const parsed = new Date(payload.Subscription.start_date)
    if (!isNaN(parsed.getTime())) periodStart = parsed
  }

  let periodEnd = new Date(periodStart)
  if (payload.Subscription?.next_payment) {
    const parsed = new Date(payload.Subscription.next_payment)
    if (!isNaN(parsed.getTime())) periodEnd = parsed
    else periodEnd.setMonth(periodEnd.getMonth() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const orderId = payload.order_id || subscriptionId || crypto.randomUUID()

  const planMapped = Deno.env.get('PLAN_OVERRIDE') || planCode;
  const freq = payload.Subscription?.plan?.frequency?.toLowerCase() || 'monthly';
  const cycleMapped = freq.includes('year') ? 'yearly' : freq.includes('quarter') ? 'quarterly' : 'monthly';

  if (!payload.Subscription?.next_payment) {
    if (cycleMapped === 'yearly') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else if (cycleMapped === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3);
  }

  // ===== ENTITLEMENT UPDATES =====
  if (status === 'active') {
    // Upsert entitlement
    const { error: upsertErr } = await supabase.from('entitlements').upsert({
      email: buyerEmail,
      plan: planMapped,
      billing_cycle: cycleMapped,
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      provider: 'kiwify',
      provider_ref: orderId,
      metadata: payload as any
    }, { onConflict: 'email' });

    if (upsertErr) {
      console.error('[KIWIFY] Error upserting entitlement:', upsertErr);
      throw upsertErr;
    } else {
      console.log(`[KIWIFY] ✅ Entitlement active mapped for ${buyerEmail}`);

      // Disparar o envio do email de Boas-vindas / Acesso
      // Evitamos enviar no "subscription_renewed" para não gerar spam todo mês
      if (eventType !== 'subscription_renewed') {
        await sendActivationEmail(supabase, buyerEmail, planMapped);
      }
    }
  } else if (status === 'canceled' || status === 'past_due') {
    const { error: updateErr } = await supabase.from('entitlements').update({
      status: status
    }).eq('email', buyerEmail);

    if (updateErr) {
      console.error('[KIWIFY] Error updating entitlement status:', updateErr);
    } else {
      console.log(`[KIWIFY] ❌ Entitlement ${status} for ${buyerEmail}`);
    }
  }

  // A criação e atualização do establishment/subscription real agora 
  // acontece na chamada de applyEntitlements no login, por isso removemos
  // o código legado que buscava user e fazia o upsert.
}

/**
 * Envia email pós-compra detectando se o usuário já tem conta ou não.
 */
async function sendActivationEmail(
  supabase: SupabaseClient,
  email: string,
  planCode: string,
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.warn('[KIWIFY] RESEND_API_KEY not configured, skipping email send')
    return
  }

  // Step 1: Check if auth user already exists
  let userExists = false
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  if (existingUsers?.users) {
    userExists = existingUsers.users.some(
      (u: { email?: string }) => u.email?.toLowerCase().trim() === email
    )
  }

  const planNames: Record<string, string> = {
    solo: 'Solo',
    studio: 'Studio',
    pro: 'Pro',
  }
  const planDisplayName = planNames[planCode] || planCode

  let actionLink = '';
  let buttonText = '';
  let subtitleText = '';

  if (userExists) {
    // If they already have an account, just send them to login
    actionLink = `${APP_URL}/login`;
    buttonText = 'Acessar meu painel';
    subtitleText = 'Detectamos que você já possui uma conta. Basta fazer login para ver seu plano atualizado.';
  } else {
    // If they don't have an account, send them to signup with their email pre-filled
    actionLink = `${APP_URL}/cadastro?email=${encodeURIComponent(email)}`;
    buttonText = 'Completar meu cadastro';
    subtitleText = 'Como este é seu primeiro acesso, clique abaixo para completar seu cadastro e criar sua senha.';
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="100%" style="max-width:560px;">
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#111827;">Agendali</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-radius:12px;padding:32px;">
              <h2 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111827;">
                🎉 Sua assinatura foi confirmada!
              </h2>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#374151;">
                Parabéns! O pagamento do seu plano <strong>${planDisplayName}</strong> foi aprovado e seu acesso está garantido.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">
                ${subtitleText}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" 
                       style="display:inline-block;padding:14px 32px;background-color:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Você recebeu este email porque adquiriu um plano no Agendali. Seus dados estão seguros.
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                ${APP_URL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Agendali <noreply@agendali.online>',
        to: [email],
        subject: `Assinatura Aprovada — Acesso ao plano ${planDisplayName}`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text()
      console.error('[KIWIFY] Resend error:', resendError)
    } else {
      console.log(`[KIWIFY] ✅ Post-purchase email sent to ${email} (User exists: ${userExists})`)
    }
  } catch (err) {
    console.error('[KIWIFY] Error sending email via Resend:', err)
  }
}
