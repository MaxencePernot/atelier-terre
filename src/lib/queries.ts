// Fonctions d'accès aux données — centralisent les requêtes Supabase du storefront.
import { supabase } from './supabase'
import type { Category, Product, ShippingSettings } from './types'

const PRODUCT_SELECT =
  '*, images:product_images(*), category:categories(*)'

/** Trie les images par position (0 = principale) après réception. */
function withSortedImages(p: Product): Product {
  return { ...p, images: (p.images ?? []).slice().sort((a, b) => a.position - b.position) }
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position')
  if (error) throw error
  return data ?? []
}

export interface ProductQuery {
  categorySlug?: string
  onlyAvailable?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc'
  search?: string
}

export async function fetchProducts(q: ProductQuery = {}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_published', true)

  if (q.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', q.categorySlug)
      .maybeSingle()
    if (cat) query = query.eq('category_id', cat.id)
  }
  if (q.onlyAvailable) query = query.eq('status', 'available').gt('stock', 0)
  if (q.search) query = query.ilike('name', `%${q.search}%`)

  switch (q.sort) {
    case 'price_asc':
      query = query.order('price_cents', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price_cents', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(withSortedImages)
}

export async function fetchFeatured(limit = 4): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_published', true)
    .eq('is_featured', true)
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(withSortedImages)
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return data ? withSortedImages(data) : null
}

export async function fetchRelated(product: Product, limit = 3): Promise<Product[]> {
  if (!product.category_id) return []
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_published', true)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(limit)
  if (error) throw error
  return (data ?? []).map(withSortedImages)
}

export async function fetchSetting<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  if (error) throw error
  return (data?.value as T) ?? null
}

/** Réglages de livraison, avec valeurs de repli si non configurés. */
export async function fetchShipping(): Promise<ShippingSettings> {
  const s = await fetchSetting<ShippingSettings>('shipping')
  return (
    s ?? {
      free_threshold_cents: 12000,
      flat_rate_cents: 700,
      delay: 'Expédition sous 3 à 5 jours ouvrés.',
      zones: 'France et Union européenne.',
    }
  )
}

export function computeShipping(subtotalCents: number, s: ShippingSettings): number {
  if (subtotalCents === 0) return 0
  return subtotalCents >= s.free_threshold_cents ? 0 : s.flat_rate_cents
}
