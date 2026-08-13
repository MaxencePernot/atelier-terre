import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/lib/types'
import { formatPrice, slugify } from '@/lib/format'
import Spinner from '@/components/ui/Spinner'

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, images:product_images(*)')
      .order('created_at', { ascending: false })
    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  async function togglePublish(p: Product) {
    await supabase.from('products').update({ is_published: !p.is_published }).eq('id', p.id)
    load()
  }

  async function duplicate(p: Product) {
    const copyName = `${p.name} (copie)`
    // On recopie explicitement les champs métier (sans id / dates / relations).
    await supabase.from('products').insert({
      name: copyName,
      slug: `${slugify(copyName)}-${Date.now().toString(36)}`,
      description: p.description,
      making_info: p.making_info,
      price_cents: p.price_cents,
      currency: p.currency,
      category_id: p.category_id,
      stock: p.stock,
      max_per_order: p.max_per_order,
      dimensions: p.dimensions,
      weight_grams: p.weight_grams,
      materials: p.materials,
      colors: p.colors,
      extra_info: p.extra_info,
      status: p.status,
      is_featured: p.is_featured,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      is_published: false,
    })
    load()
  }

  async function remove(p: Product) {
    if (!confirm(`Supprimer « ${p.name} » ? Cette action est définitive.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Produits</h1>
        <Link to="/admin/produits/nouveau" className="btn-primary">
          + Nouvelle pièce
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-ink/5">
          <table className="w-full text-sm">
            <thead className="bg-paper-deep text-left text-ink-soft">
              <tr>
                <th className="p-4 font-medium">Pièce</th>
                <th className="p-4 font-medium">Prix</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium">En ligne</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 bg-surface">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-lg bg-paper-deep">
                        {p.images?.[0] && (
                          <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.is_featured && <span className="text-xs text-ochre">Mise en avant</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{formatPrice(p.price_cents)}</td>
                  <td className="p-4">{p.stock}</td>
                  <td className="p-4">
                    {p.status === 'sold' ? 'Vendu' : p.status === 'coming_soon' ? 'Bientôt' : 'Disponible'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => togglePublish(p)}
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        p.is_published ? 'bg-celadon-wash text-celadon-deep' : 'bg-ink/10 text-ink-faint'
                      }`}
                    >
                      {p.is_published ? 'Publié' : 'Brouillon'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-3 text-ink-faint">
                      <Link to={`/admin/produits/${p.id}`} className="hover:text-ink">Modifier</Link>
                      <button onClick={() => duplicate(p)} className="hover:text-ink">Dupliquer</button>
                      <button onClick={() => remove(p)} className="hover:text-clay">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-ink-faint">
                    Aucune pièce. Créez votre première poterie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
