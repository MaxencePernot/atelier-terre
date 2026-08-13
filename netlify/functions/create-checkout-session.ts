import type { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

/**
 * Crée une session Stripe Checkout.
 *
 * Sécurité : les PRIX et le STOCK ne sont JAMAIS pris depuis le client.
 * On relit les produits côté serveur (clé service_role) pour recalculer le
 * montant réel — le navigateur n'envoie que des identifiants + quantités.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
)

const SITE_URL = process.env.VITE_SITE_URL || process.env.URL || 'http://localhost:5173'

interface Body {
  items: { productId: string; quantity: number }[]
  customer: { first_name: string; last_name: string; email: string; phone: string | null }
  shipping_address: Record<string, unknown>
  billing_address: Record<string, unknown> | null
}

function orderNumber(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ATL-${ymd}-${rand}`
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const body = JSON.parse(event.body || '{}') as Body
    if (!body.items?.length || !body.customer?.email) {
      return json(400, { error: 'Panier ou informations client manquants.' })
    }

    // 1. Relecture serveur des produits (prix + stock de référence).
    const ids = body.items.map((i) => i.productId)
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price_cents, currency, stock, status, max_per_order')
      .in('id', ids)
    if (error) throw error

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    const orderItems: { product_id: string; product_name: string; unit_price_cents: number; quantity: number }[] = []
    let subtotal = 0
    let currency = 'eur'

    for (const item of body.items) {
      const p = products?.find((x) => x.id === item.productId)
      if (!p) return json(400, { error: 'Produit introuvable.' })
      if (p.status === 'sold' || p.stock <= 0) {
        return json(409, { error: `« ${p.name} » n'est plus disponible.` })
      }
      const qty = Math.min(item.quantity, p.max_per_order, p.stock)
      if (qty <= 0) return json(409, { error: `Stock insuffisant pour « ${p.name} ».` })

      currency = p.currency
      subtotal += p.price_cents * qty
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: p.currency,
          unit_amount: p.price_cents,
          product_data: { name: p.name },
        },
      })
      orderItems.push({
        product_id: p.id,
        product_name: p.name,
        unit_price_cents: p.price_cents,
        quantity: qty,
      })
    }

    // 2. Frais de livraison (réglages éditables dans site_settings).
    const { data: shippingSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'shipping')
      .maybeSingle()
    const ship = (shippingSetting?.value as { free_threshold_cents: number; flat_rate_cents: number }) ?? {
      free_threshold_cents: 12000,
      flat_rate_cents: 700,
    }
    const shippingCents = subtotal >= ship.free_threshold_cents ? 0 : ship.flat_rate_cents

    // 3. Enregistre / met à jour le client.
    const { data: customer } = await supabase
      .from('customers')
      .upsert(
        {
          email: body.customer.email,
          first_name: body.customer.first_name,
          last_name: body.customer.last_name,
          phone: body.customer.phone,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    // 4. Crée la commande en attente (le stock sera décrémenté par le webhook).
    const number = orderNumber()
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: number,
        customer_id: customer?.id ?? null,
        email: body.customer.email,
        subtotal_cents: subtotal,
        shipping_cents: shippingCents,
        total_cents: subtotal + shippingCents,
        currency,
        shipping_address: body.shipping_address,
        billing_address: body.billing_address,
        payment_status: 'pending',
        fulfillment_status: 'new',
      })
      .select('id')
      .single()
    if (orderErr) throw orderErr

    await supabase
      .from('order_items')
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })))

    // 5. Session Stripe.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: body.customer.email,
      shipping_options: shippingCents
        ? [
            {
              shipping_rate_data: {
                type: 'fixed_amount',
                fixed_amount: { amount: shippingCents, currency },
                display_name: 'Livraison',
              },
            },
          ]
        : undefined,
      success_url: `${SITE_URL}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/panier`,
      metadata: { order_id: order.id, order_number: number },
    })

    // On relie la session Stripe à la commande pour le webhook + la confirmation.
    await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id)

    return json(200, { url: session.url })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('create-checkout-session:', e)
    return json(500, { error: 'Impossible de créer la session de paiement.' })
  }
}

function json(statusCode: number, data: unknown) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}
