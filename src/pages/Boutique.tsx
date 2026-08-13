import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCategories, fetchProducts } from '@/lib/queries'
import type { Category, Product } from '@/lib/types'
import { useSeo } from '@/lib/seo'
import ProductCard from '@/components/product/ProductCard'
import Spinner from '@/components/ui/Spinner'

type Sort = 'newest' | 'price_asc' | 'price_desc'

export default function Boutique() {
  const { categorySlug } = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<Sort>('newest')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [search, setSearch] = useState('')

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug],
  )

  useSeo({
    title: activeCategory
      ? `${activeCategory.name} — Boutique — Atelier Terre`
      : 'Boutique — Poteries artisanales — Atelier Terre',
    description:
      'Parcourez toutes nos poteries disponibles : vases, bols, tasses, assiettes et pièces uniques.',
  })

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchProducts({ categorySlug, sort, onlyAvailable, search: search.trim() || undefined })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [categorySlug, sort, onlyAvailable, search])

  return (
    <div className="shell py-10 lg:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow">Boutique</p>
        <h1 className="mt-2 text-display-lg">{activeCategory ? activeCategory.name : 'Toutes les pièces'}</h1>
        {activeCategory?.description && (
          <p className="mt-3 text-lg text-ink-soft">{activeCategory.description}</p>
        )}
      </header>

      {/* Catégories */}
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Catégories">
        <CategoryPill to="/boutique" active={!categorySlug}>
          Tout
        </CategoryPill>
        {categories.map((c) => (
          <CategoryPill key={c.id} to={`/boutique/${c.slug}`} active={c.slug === categorySlug}>
            {c.name}
          </CategoryPill>
        ))}
      </nav>

      {/* Barre de filtres */}
      <div className="mt-6 flex flex-col gap-4 border-y border-ink/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Rechercher une pièce</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une pièce…"
            className="field py-2.5 pl-10"
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </label>

        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-ink/30 text-celadon-deep focus:ring-celadon"
            />
            Disponibles uniquement
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="sr-only">Trier</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="field w-auto py-2 pr-8 text-sm"
            >
              <option value="newest">Nouveautés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
            </select>
          </label>
        </div>
      </div>

      {/* Grille */}
      {loading ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg text-ink-soft">Aucune pièce ne correspond pour l’instant.</p>
          <Link to="/boutique" className="btn-quiet mt-3">
            Voir toute la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryPill({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={`rounded-full px-4 py-2 text-sm transition-colors ${
        active
          ? 'bg-ink text-paper'
          : 'border border-ink/15 text-ink-soft hover:border-ink hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}
