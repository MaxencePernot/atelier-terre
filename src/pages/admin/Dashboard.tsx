import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { formatDate, formatPrice, STATUS_LABELS } from '@/lib/format'
import type { Order } from '@/lib/types'
import Spinner from '@/components/ui/Spinner'

type Period = 'today' | '7d' | '30d' | '12m' | 'all'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '12m', label: '12 mois' },
  { key: 'all', label: 'Tout' },
]

function periodStart(p: Period): Date | null {
  const d = new Date()
  switch (p) {
    case 'today':
      d.setHours(0, 0, 0, 0)
      return d
    case '7d':
      d.setDate(d.getDate() - 7)
      return d
    case '30d':
      d.setDate(d.getDate() - 30)
      return d
    case '12m':
      d.setMonth(d.getMonth() - 12)
      return d
    default:
      return null
  }
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('30d')
  const [orders, setOrders] = useState<Order[]>([])
  const [productCounts, setProductCounts] = useState({ available: 0, sold: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const start = periodStart(period)
      let q = supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
      if (start) q = q.gte('created_at', start.toISOString())
      const { data } = await q
      setOrders((data as Order[]) ?? [])

      const [{ count: avail }, { count: sold }] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
      ])
      setProductCounts({ available: avail ?? 0, sold: sold ?? 0 })
      setLoading(false)
    }
    load()
  }, [period])

  const stats = useMemo(() => {
    const revenue = orders.reduce((s, o) => s + o.total_cents, 0)
    const count = orders.length
    const avg = count ? revenue / count : 0
    // Top produits sur la période
    const map = new Map<string, { name: string; qty: number }>()
    for (const o of orders) {
      for (const it of o.items ?? []) {
        const cur = map.get(it.product_name) ?? { name: it.product_name, qty: 0 }
        cur.qty += it.quantity
        map.set(it.product_name, cur)
      }
    }
    const top = [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
    return { revenue, count, avg, top }
  }, [orders])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Tableau de bord</h1>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                period === p.key ? 'bg-ink text-paper' : 'border border-ink/15 text-ink-soft hover:border-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Chiffre d’affaires" value={formatPrice(stats.revenue)} accent />
            <StatCard label="Commandes" value={String(stats.count)} />
            <StatCard label="Panier moyen" value={formatPrice(Math.round(stats.avg))} />
            <StatCard
              label="Pièces en ligne"
              value={`${productCounts.available} dispo · ${productCounts.sold} vendues`}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* Commandes récentes */}
            <section className="rounded-2xl bg-surface p-5 ring-1 ring-ink/5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">Commandes récentes</h2>
                <Link to="/admin/commandes" className="btn-quiet">Tout voir →</Link>
              </div>
              {orders.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-faint">Aucune commande sur la période.</p>
              ) : (
                <ul className="mt-4 divide-y divide-ink/10">
                  {orders.slice(0, 6).map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-ink-faint">{o.email} · {formatDate(o.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(o.total_cents)}</p>
                        <p className="text-ink-faint">{STATUS_LABELS[o.fulfillment_status]}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Meilleures ventes */}
            <section className="rounded-2xl bg-surface p-5 ring-1 ring-ink/5">
              <h2 className="font-display text-xl">Meilleures ventes</h2>
              {stats.top.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-faint">Pas encore de ventes.</p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {stats.top.map((t, i) => (
                    <li key={t.name} className="flex items-center gap-3 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-celadon-wash text-xs font-medium text-celadon-deep">
                        {i + 1}
                      </span>
                      <span className="flex-1">{t.name}</span>
                      <span className="text-ink-faint">×{t.qty}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ring-ink/5 ${accent ? 'bg-ink text-paper' : 'bg-surface'}`}>
      <p className={`text-sm ${accent ? 'text-paper/70' : 'text-ink-faint'}`}>{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  )
}
