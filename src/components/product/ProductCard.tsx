import { Link } from 'react-router-dom'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import RingMark from '@/components/ui/RingMark'

export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]
  const sold = product.status === 'sold' || product.stock <= 0

  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group block focus:outline-none"
      aria-label={`${product.name} — ${formatPrice(product.price_cents, product.currency)}`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-surface shadow-soft ring-1 ring-ink/5 transition-shadow duration-500 group-hover:shadow-lift">
        <div className="aspect-[4/5] overflow-hidden">
          {image ? (
            <img
              src={image.url}
              alt={image.alt ?? product.name}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04] ${
                sold ? 'opacity-70 grayscale-[0.15]' : ''
              }`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-faint">
              <RingMark className="h-16 w-16" />
            </div>
          )}
        </div>

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/35">
            <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium tracking-wide text-paper">
              Vendu
            </span>
          </div>
        )}

        {product.status === 'coming_soon' && !sold && (
          <span className="absolute left-3 top-3 rounded-full bg-ochre/90 px-2.5 py-1 text-[11px] font-medium text-paper">
            Bientôt
          </span>
        )}
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-snug text-ink">{product.name}</h3>
        <span className="shrink-0 text-sm font-medium text-ink-soft">
          {formatPrice(product.price_cents, product.currency)}
        </span>
      </div>
      {product.materials && (
        <p className="mt-0.5 text-sm text-ink-faint">{product.materials}</p>
      )}
    </Link>
  )
}
