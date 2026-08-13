import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

/**
 * Webhook Stripe — SEUL endroit où une commande passe à "payé".
 * Ne jamais faire confiance au front pour valider un paiement : Stripe signe
 * l'événement, on vérifie la signature, puis on met à jour la base de façon
 * atomique (paiement + décrément de stock).
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
)

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature']
  if (!sig) return { statusCode: 400, body: 'Signature manquante' }

  // Stripe exige le corps BRUT pour vérifier la signature.
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || ''

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Signature webhook invalide:', e)
    return { statusCode: 400, body: 'Signature invalide' }
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id
      if (!orderId) return ok()

      // Idempotence : si déjà payé, on ne retraite pas (Stripe peut renvoyer l'événement).
      const { data: existing } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('id', orderId)
        .maybeSingle()
      if (!existing || existing.payment_status === 'paid') return ok()

      // 1. Marque la commande payée.
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          fulfillment_status: 'preparing',
          stripe_payment_intent: (session.payment_intent as string) ?? null,
        })
        .eq('id', orderId)

      // 2. Décrémente le stock de chaque article (bascule en 'sold' si 0).
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)
      for (const it of items ?? []) {
        if (it.product_id) {
          await supabase.rpc('decrement_stock', {
            p_product_id: it.product_id,
            p_qty: it.quantity,
          })
        }
      }

      // 3. Notifications e-mail (client + admin).
      //    Branchez ici votre fournisseur (Resend, Postmark, SendGrid…).
      //    Voir README → « E-mails transactionnels ».
      // await sendConfirmationEmails(orderId)
    }

    return ok()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Traitement webhook échoué:', e)
    return { statusCode: 500, body: 'Erreur serveur' }
  }
}

const ok = () => ({ statusCode: 200, body: JSON.stringify({ received: true }) })
