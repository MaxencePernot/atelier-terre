import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { computeShipping, fetchShipping } from '@/lib/queries'
import type { ShippingSettings } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import { useSeo } from '@/lib/seo'
import RingMark from '@/components/ui/RingMark'

export default function CartPage() {
  const { lines, subtotalCents, setQuantity, removeItem } = useCart()
  const [shipping, setShipping] = useState<ShippingSettings | null>(null)
  const navigate = useNavigate()

  useSeo({ title: 'Panier — Atelier Terre' })
  useEffect(() => {
    fetchShipping().then(setShipping)
  }, [])

  const shippingCents = shipping ? computeShipping(subtotalCents, shipping) : 0
  const totalCents = subtotalCents + shippingCents

  if (lines.length === 0) {
    return (
      <div className="shell py-24 text-center">
        <RingMark className="mx-auto h-14 w-14 text-celadon-deep/50" />
        <h1 className="mt-6 text-display-md">Votre panier est vide</h1>
        <p className="mt-2 text-ink-soft">Il attend sa première pièce.</p>
        <Link to="/boutique" className="btn-primary mt-6">
          Parcourir la boutique
        </Link>
      </div>
    )
  }

  return (
    <div className="shell py-10 lg:py-14">
      <h1 className="text-display-lg">Panier</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Lignes */}
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-4 py-5">
              <Link
                to={`/produit/${line.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-ink/5"
              >
                {line.image ? (
                  <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-faint">—</div>
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/produit/${line.slug}`} className="font-display text-lg hover:underline">
                      {line.name}
                    </Link>
                    <p className="text-sm text-ink-faint">
                      {formatPrice(line.priceCents)} l’unité
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(line.priceCents * line.quantity)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-ink/15">
                    <button
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg disabled:opacity-30"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= Math.min(line.maxPerOrder, line.stock)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg disabled:opacity-30"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(line.productId)}
                    className="text-sm text-ink-faint underline-offset-4 hover:text-ink hover:underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Récapitulatif */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-paper-deep p-6 ring-1 ring-ink/5">
            <h2 className="font-display text-xl">Récapitulatif</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Sous-total</dt>
                <dd>{formatPrice(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Livraison</dt>
                <dd>{shippingCents === 0 ? 'Offerte' : formatPrice(shippingCents)}</dd>
              </div>
              {shipping && shippingCents > 0 && (
                <p className="text-xs text-ink-faint">
                  Livraison offerte dès {formatPrice(shipping.free_threshold_cents)} d’achat.
                </p>
              )}
              <div className="hairline mt-2 flex justify-between pt-3 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(totalCents)}</dd>
              </div>
            </dl>

            <button onClick={() => navigate('/commande')} className="btn-primary mt-6 w-full">
              Passer à la commande
            </button>
            <Link to="/boutique" className="btn-quiet mt-4 w-full justify-center">
              ← Continuer mes achats
            </Link>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-faint">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Paiement sécurisé par Stripe
          </p>
        </aside>
      </div>
    </div>
  )
}
