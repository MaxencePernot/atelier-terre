import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useSeo } from '@/lib/seo'
import { formatPrice } from '@/lib/format'
import RingMark from '@/components/ui/RingMark'
import Spinner from '@/components/ui/Spinner'

interface OrderSummary {
  order_number: string
  total_cents: number
  currency: string
  email: string
  payment_status: string
}

export default function Confirmation() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useSeo({ title: 'Commande confirmée — Atelier Terre' })

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }
    // Le webhook Stripe traite la commande de façon asynchrone : on interroge
    // le statut avec quelques tentatives le temps qu'il soit enregistré.
    let tries = 0
    const poll = async () => {
      try {
        const res = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`)
        if (res.ok) {
          const data = await res.json()
          if (data?.order_number) {
            setOrder(data)
            setLoading(false)
            return
          }
        }
      } catch {
        /* on retente */
      }
      if (++tries < 6) setTimeout(poll, 1500)
      else setLoading(false)
    }
    poll()
  }, [sessionId])

  return (
    <div className="shell py-20 text-center lg:py-28">
      <RingMark className="mx-auto h-16 w-16 text-celadon-deep" />
      <h1 className="mt-6 text-display-lg">Merci pour votre commande</h1>

      {loading ? (
        <Spinner label="Enregistrement de votre commande…" />
      ) : order ? (
        <div className="mx-auto mt-6 max-w-md">
          <p className="text-lg text-ink-soft">
            Votre commande <span className="font-medium text-ink">{order.order_number}</span> est
            confirmée.
          </p>
          <div className="mt-6 rounded-2xl bg-paper-deep p-6 text-left text-sm">
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Numéro</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Total</span>
              <span className="font-medium">{formatPrice(order.total_cents, order.currency)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Confirmation envoyée à</span>
              <span className="font-medium">{order.email}</span>
            </div>
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            Un e-mail de confirmation vient de vous être envoyé. Nous préparons votre pièce avec soin.
          </p>
        </div>
      ) : (
        <p className="mx-auto mt-6 max-w-md text-ink-soft">
          Votre paiement a bien été reçu. Si vous ne recevez pas d’e-mail de confirmation d’ici
          quelques minutes, contactez-nous.
        </p>
      )}

      <Link to="/boutique" className="btn-primary mt-8">
        Continuer à explorer
      </Link>
    </div>
  )
}
