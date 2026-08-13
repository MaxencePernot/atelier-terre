import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
)

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = 'Atelier Terre <onboarding@resend.dev>'

const euros = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature']
  if (!sig) return { statusCode: 400, body: 'Signature manquante' }

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || ''

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
  } catch (e) {
    console.error('Signature webhook invalide:', e)
    return { statusCode: 400, body: 'Signature invalide' }
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      if (!orderId) return ok()

      const { data: existing } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('id', orderId)
        .maybeSingle()
      if (!existing || existing.payment_status === 'paid') return ok()

      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          fulfillment_status: 'preparing',
          stripe_payment_intent: (session.payment_intent as string) ?? null,
        })
        .eq('id', orderId)

      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, product_id, quantity, unit_price_cents')
        .eq('order_id', orderId)
      for (const it of items ?? []) {
        if (it.product_id) {
          await supabase.rpc('decrement_stock', {
            p_product_id: it.product_id,
            p_qty: it.quantity,
          })
        }
      }

      try {
        await sendConfirmationEmail(orderId, items ?? [])
      } catch (mailErr) {
        console.error('Envoi e-mail échoué (commande OK malgré tout):', mailErr)
      }
    }

    return ok()
  } catch (e) {
    console.error('Traitement webhook échoué:', e)
    return { statusCode: 500, body: 'Erreur serveur' }
  }
}

type Item = { product_name: string; quantity: number; unit_price_cents: number }

async function sendConfirmationEmail(orderId: string, items: Item[]) {
  if (!resend) {
    console.log('RESEND_API_KEY absente : e-mail de confirmation ignoré.')
    return
  }

  const { data: order } = await supabase
    .from('orders')
    .select('order_number, email, subtotal_cents, shipping_cents, total_cents')
    .eq('id', orderId)
    .maybeSingle()
  if (!order) return

  const rows = items
    .map(
      (it) =>
        `<tr>
           <td style="padding:8px 0;color:#2A2521;">${escapeHtml(it.product_name)} × ${it.quantity}</td>
           <td style="padding:8px 0;text-align:right;color:#2A2521;">${euros(it.unit_price_cents * it.quantity)}</td>
         </tr>`,
    )
    .join('')

  const shippingLine = order.shipping_cents === 0 ? 'Offerte' : euros(order.shipping_cents)

  const html = `
  <div style="background:#E9E4DA;padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#F3EFE7;border-radius:16px;padding:32px;">
      <h1 style="font-size:22px;color:#2A2521;margin:0 0 4px;">Merci pour votre commande</h1>
      <p style="color:#51705F;margin:0 0 24px;">Nous préparons votre pièce avec soin.</p>
      <p style="color:#6B6157;margin:0 0 4px;font-size:14px;">Numéro de commande</p>
      <p style="color:#2A2521;margin:0 0 20px;font-size:18px;font-weight:600;">${escapeHtml(order.order_number)}</p>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #E0D8CB;">${rows}</table>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #E0D8CB;margin-top:8px;">
        <tr><td style="padding:8px 0;color:#6B6157;">Sous-total</td><td style="padding:8px 0;text-align:right;color:#6B6157;">${euros(order.subtotal_cents)}</td></tr>
        <tr><td style="padding:4px 0;color:#6B6157;">Livraison</td><td style="padding:4px 0;text-align:right;color:#6B6157;">${shippingLine}</td></tr>
        <tr><td style="padding:8px 0;color:#2A2521;font-weight:600;">Total</td><td style="padding:8px 0;text-align:right;color:#2A2521;font-weight:600;">${euros(order.total_cents)}</td></tr>
      </table>
      <p style="color:#6B6157;font-size:13px;margin:24px 0 0;">Atelier Terre — céramiques tournées et émaillées à la main.</p>
    </div>
  </div>`

  const text = `Merci pour votre commande !

Numéro : ${order.order_number}
${items.map((it) => `- ${it.product_name} x${it.quantity} : ${euros(it.unit_price_cents * it.quantity)}`).join('\n')}

Sous-total : ${euros(order.subtotal_cents)}
Livraison : ${shippingLine}
Total : ${euros(order.total_cents)}

Atelier Terre`

  await resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `Confirmation de commande ${order.order_number} — Atelier Terre`,
    html,
    text,
  })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const ok = () => ({ statusCode: 200, body: JSON.stringify({ received: true }) })
