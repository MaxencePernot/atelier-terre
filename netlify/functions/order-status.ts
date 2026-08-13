import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

/**
 * Renvoie un résumé minimal d'une commande à partir de l'ID de session Stripe.
 * Utilisé par la page de confirmation. On n'expose que le strict nécessaire
 * (numéro, total, e-mail, statut) — jamais l'adresse complète ni le détail.
 */

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } },
)

export const handler: Handler = async (event) => {
  const sessionId = event.queryStringParameters?.session_id
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'session_id manquant' }) }
  }

  const { data, error } = await supabase
    .from('orders')
    .select('order_number, total_cents, currency, email, payment_status')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (error || !data) {
    // La commande n'est peut-être pas encore enregistrée par le webhook.
    return { statusCode: 404, body: JSON.stringify({ pending: true }) }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }
}
