import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProductBySlug, fetchRelated } from '@/lib/queries'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import { useSeo } from '@/lib/seo'
import { useCart } from '@/context/CartContext'
import ProductCard from '@/components/product/ProductCard'
import StatusBadge from '@/components/ui/StatusBadge'
import Spinner from '@/components/ui/Spinner'

export default function ProductPage() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setActiveImg(0)
    fetchProductBySlug(slug)
      .then(async (p) => {
        setProduct(p)
        if (p) setRelated(await fetchRelated(p, 3))
      })
      .finally(() => setLoading(false))
  }, [slug])

  const sold = useMemo(
    () => !!product && (product.status === 'sold' || product.stock <= 0),
    [product],
  )

  useSeo({
    title: product
      ? product.seo_title ?? `${product.name} — Atelier Terre`
      : 'Pièce — Atelier Terre',
    description:
      product?.seo_description ?? product?.description ?? undefined,
    image: product?.images?.[0]?.url,
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description ?? undefined,
          image: product.images?.map((i) => i.url),
          material: product.materials ?? undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: product.currency.toUpperCase(),
            price: (product.price_cents / 100).toFixed(2),
            availability: sold
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
          },
        }
      : undefined,
  })

  if (loading) return <Spinner />
  if (!product) {
    return (
      <div className="shell py-28 text-center">
        <h1 className="text-display-md">Pièce introuvable</h1>
        <p className="mt-3 text-ink-soft">Elle a peut-être trouvé preneur.</p>
        <Link to="/boutique" className="btn-primary mt-6">
          Retour à la boutique
        </Link>
      </div>
    )
  }

  const images = product.images ?? []

  function handleAdd() {
    if (!product || sold) return
    addItem(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <div className="shell py-8 lg:py-12">
      {/* Fil d'Ariane */}
      <nav className="mb-6 text-sm text-ink-faint" aria-label="Fil d’Ariane">
        <Link to="/boutique" className="hover:text-ink">Boutique</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/boutique/${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Galerie */}
        <div>
          <div
            className={`relative overflow-hidden rounded-3xl bg-surface ring-1 ring-ink/5 ${
              zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setZoom((z) => !z)}
          >
            <div className="aspect-square">
              {images[activeImg] ? (
                <img
                  src={images[activeImg].url}
                  alt={images[activeImg].alt ?? product.name}
                  className={`h-full w-full object-cover transition-transform duration-500 ease-out-soft ${
                    zoom ? 'scale-[1.7]' : 'scale-100'
                  } ${sold ? 'opacity-80' : ''}`}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-faint">
                  Pas d’image
                </div>
              )}
            </div>
            {sold && (
              <span className="absolute left-4 top-4 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper">
                Vendu
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImg(i)}
                  aria-label={`Voir l’image ${i + 1}`}
                  className={`h-20 w-20 overflow-hidden rounded-xl ring-1 transition ${
                    i === activeImg ? 'ring-2 ring-celadon-deep' : 'ring-ink/10 hover:ring-ink/30'
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détails */}
        <div className="lg:pt-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={sold ? 'sold' : product.status} />
            {product.max_per_order === 1 && (
              <span className="text-xs uppercase tracking-eyebrow text-ochre">Pièce unique</span>
            )}
          </div>

          <h1 className="mt-4 text-display-lg">{product.name}</h1>
          <p className="mt-3 text-2xl font-medium text-ink">
            {formatPrice(product.price_cents, product.currency)}
          </p>

          {product.description && (
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">{product.description}</p>
          )}

          {/* Achat */}
          <div className="mt-8">
            {sold ? (
              <div className="rounded-2xl border border-ink/10 bg-paper-deep p-5">
                <p className="font-medium">Cette pièce a trouvé preneur.</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Chaque création étant unique, celle-ci ne sera pas refaite à l’identique.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={handleAdd} className="btn-primary min-w-[220px]">
                  {added ? 'Ajouté au panier ✓' : 'Ajouter au panier'}
                </button>
                <Link to="/panier" className="btn-quiet">
                  Voir le panier →
                </Link>
              </div>
            )}
            {!sold && product.stock <= 3 && (
              <p className="mt-3 text-sm text-ochre">
                Plus que {product.stock} en stock.
              </p>
            )}
          </div>

          {/* Caractéristiques */}
          <dl className="mt-10 divide-y divide-ink/10 border-t border-ink/10 text-sm">
            <Row label="Dimensions" value={product.dimensions} />
            <Row label="Matériaux" value={product.materials} />
            <Row label="Couleurs" value={product.colors} />
            <Row
              label="Poids"
              value={product.weight_grams ? `${product.weight_grams} g` : null}
            />
            <Row label="Fabrication" value={product.making_info} />
            <Row label="Informations" value={product.extra_info} />
          </dl>
        </div>
      </div>

      {/* Vous pourriez aussi aimer */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-display-md">Vous pourriez également aimer</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 py-3">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  )
}
