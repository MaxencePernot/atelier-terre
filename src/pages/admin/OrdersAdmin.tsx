import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FulfillmentStatus, Order } from '@/lib/types'
import { formatDate, formatPrice, STATUS_LABELS } from '@/lib/format'
import Spinner from '@/components/ui/Spinner'

const FULFILLMENT: FulfillmentStatus[] = [
  'new',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
]

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false })
    setOrders((data as Order[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  async function updateStatus(order: Order, status: FulfillmentStatus) {
    await supabase.from('orders').update({ fulfillment_status: status }).eq('id', order.id)
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, fulfillment_status: status } : o)),
    )
    setSelected((s) => (s ? { ...s, fulfillment_status: status } : s))
  }

  return (
    <div>
      <h1 className="font-display text-3xl">Commandes</h1>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-ink/5">
          <table className="w-full text-sm">
            <thead className="bg-paper-deep text-left text-ink-soft">
              <tr>
                <th className="p-4 font-medium">Commande</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Montant</th>
                <th className="p-4 font-medium">Paiement</th>
                <th className="p-4 font-medium">Suivi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 bg-surface">
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className="cursor-pointer hover:bg-paper/60"
                >
                  <td className="p-4 font-medium">{o.order_number}</td>
                  <td className="p-4 text-ink-soft">{o.email}</td>
                  <td className="p-4 text-ink-soft">{formatDate(o.created_at)}</td>
                  <td className="p-4">{formatPrice(o.total_cents)}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        o.payment_status === 'paid'
                          ? 'bg-celadon-wash text-celadon-deep'
                          : 'bg-ochre/15 text-ochre'
                      }`}
                    >
                      {STATUS_LABELS[o.payment_status]}
                    </span>
                  </td>
                  <td className="p-4 text-ink-soft">{STATUS_LABELS[o.fulfillment_status]}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-ink-faint">
                    Aucune commande pour l’instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Panneau détail */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/30"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto bg-paper p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{selected.order_number}</h2>
              <button onClick={() => setSelected(null)} className="text-ink-faint hover:text-ink" aria-label="Fermer">✕</button>
            </div>
            <p className="mt-1 text-sm text-ink-faint">{formatDate(selected.created_at)}</p>

            <div className="mt-6 space-y-1 text-sm">
              <p className="font-medium">Client</p>
              <p className="text-ink-soft">{selected.email}</p>
              {selected.shipping_address && (
                <p className="text-ink-soft">
                  {selected.shipping_address.first_name} {selected.shipping_address.last_name}<br />
                  {selected.shipping_address.line1}
                  {selected.shipping_address.line2 ? `, ${selected.shipping_address.line2}` : ''}<br />
                  {selected.shipping_address.postal_code} {selected.shipping_address.city}<br />
                  {selected.shipping_address.country}
                </p>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium">Articles</p>
              <ul className="mt-2 divide-y divide-ink/10 text-sm">
                {selected.items?.map((it) => (
                  <li key={it.id} className="flex justify-between py-2">
                    <span>{it.product_name} ×{it.quantity}</span>
                    <span>{formatPrice(it.unit_price_cents * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Sous-total</span><span>{formatPrice(selected.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>Livraison</span>
                  <span>{selected.shipping_cents === 0 ? 'Offerte' : formatPrice(selected.shipping_cents)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span><span>{formatPrice(selected.total_cents)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Statut de la commande</p>
              <div className="flex flex-wrap gap-2">
                {FULFILLMENT.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected, s)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      selected.fulfillment_status === s
                        ? 'bg-ink text-paper'
                        : 'border border-ink/15 text-ink-soft hover:border-ink'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
