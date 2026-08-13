// Types partagés — reflètent le schéma Supabase (supabase/schema.sql).

export type ProductStatus = 'available' | 'sold' | 'coming_soon'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type FulfillmentStatus =
  | 'new'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  position: number
  created_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt: string | null
  position: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  making_info: string | null
  price_cents: number
  currency: string
  category_id: string | null
  stock: number
  max_per_order: number
  dimensions: string | null
  weight_grams: number | null
  materials: string | null
  colors: string | null
  extra_info: string | null
  status: ProductStatus
  is_published: boolean
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  // relations (chargées à la demande)
  images?: ProductImage[]
  category?: Category | null
}

export interface CartLine {
  productId: string
  slug: string
  name: string
  priceCents: number
  image: string | null
  quantity: number
  maxPerOrder: number
  stock: number
}

export interface Address {
  first_name: string
  last_name: string
  line1: string
  line2?: string
  postal_code: string
  city: string
  country: string
  phone?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  unit_price_cents: number
  quantity: number
}

export interface Order {
  id: string
  order_number: string
  email: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  currency: string
  shipping_address: Address | null
  billing_address: Address | null
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  stripe_session_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface ShippingSettings {
  free_threshold_cents: number
  flat_rate_cents: number
  delay: string
  zones: string
}
