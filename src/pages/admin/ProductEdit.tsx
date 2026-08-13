import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Category, Product, ProductImage, ProductStatus } from '@/lib/types'
import { slugify } from '@/lib/format'
import Spinner from '@/components/ui/Spinner'

const BUCKET = 'product-images'

const BLANK = {
  name: '',
  slug: '',
  description: '',
  making_info: '',
  price_cents: 0,
  currency: 'eur',
  category_id: null as string | null,
  stock: 1,
  max_per_order: 1,
  dimensions: '',
  weight_grams: null as number | null,
  materials: '',
  colors: '',
  extra_info: '',
  status: 'available' as ProductStatus,
  is_published: true,
  is_featured: false,
  seo_title: '',
  seo_description: '',
}

export default function ProductEdit() {
  const { id } = useParams()
  const isNew = id === 'nouveau' || !id
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ ...BLANK })
  const [images, setImages] = useState<ProductImage[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('categories').select('*').order('position').then(({ data }) => {
      setCategories((data as Category[]) ?? [])
    })
    if (!isNew) {
      supabase
        .from('products')
        .select('*, images:product_images(*)')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const p = data as Product
            setForm({
              name: p.name, slug: p.slug, description: p.description ?? '',
              making_info: p.making_info ?? '', price_cents: p.price_cents, currency: p.currency,
              category_id: p.category_id, stock: p.stock, max_per_order: p.max_per_order,
              dimensions: p.dimensions ?? '', weight_grams: p.weight_grams,
              materials: p.materials ?? '', colors: p.colors ?? '', extra_info: p.extra_info ?? '',
              status: p.status, is_published: p.is_published, is_featured: p.is_featured,
              seo_title: p.seo_title ?? '', seo_description: p.seo_description ?? '',
            })
            setImages((p.images ?? []).sort((a, b) => a.position - b.position))
          }
          setLoading(false)
        })
    }
  }, [id, isNew])

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))

  async function save() {
    setError(null)
    if (!form.name.trim()) return setError('Le nom est obligatoire.')
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug.trim() || slugify(form.name),
      description: form.description || null,
      making_info: form.making_info || null,
      dimensions: form.dimensions || null,
      materials: form.materials || null,
      colors: form.colors || null,
      extra_info: form.extra_info || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
    }

    if (isNew) {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      setSaving(false)
      if (error) return setError(error.message)
      navigate(`/admin/produits/${data.id}`)
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      setSaving(false)
      if (error) return setError(error.message)
      navigate('/admin/produits')
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || isNew) {
      if (isNew) setError('Enregistrez d’abord la pièce pour ajouter des photos.')
      return
    }
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop()
        const path = `${id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '31536000',
          upsert: false,
        })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const position = images.length
        const { data: row } = await supabase
          .from('product_images')
          .insert({ product_id: id, url: pub.publicUrl, alt: form.name, position })
          .select('*')
          .single()
        if (row) setImages((prev) => [...prev, row as ProductImage])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l’upload.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function moveImage(index: number, dir: -1 | 1) {
    const next = [...images]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setImages(next)
    await Promise.all(next.map((img, i) => supabase.from('product_images').update({ position: i }).eq('id', img.id)))
  }

  async function deleteImage(img: ProductImage) {
    await supabase.from('product_images').delete().eq('id', img.id)
    setImages((prev) => prev.filter((i) => i.id !== img.id))
  }

  if (loading) return <Spinner />

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{isNew ? 'Nouvelle pièce' : 'Modifier la pièce'}</h1>
        <button onClick={() => navigate('/admin/produits')} className="btn-quiet">← Retour</button>
      </div>

      {error && <p className="mt-4 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>}

      <div className="mt-6 space-y-6">
        {/* Images */}
        <Section title="Photos">
          {isNew ? (
            <p className="text-sm text-ink-faint">Enregistrez la pièce pour pouvoir ajouter des photos.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img, i) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-xl ring-1 ring-ink/10">
                    <img src={img.url} alt={img.alt ?? ''} className="aspect-square w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 py-0.5 text-[10px] text-paper">
                        Principale
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-1 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => moveImage(i, -1)} className="px-1 text-paper" aria-label="Déplacer à gauche">←</button>
                      <button onClick={() => deleteImage(img)} className="px-1 text-paper" aria-label="Supprimer">✕</button>
                      <button onClick={() => moveImage(i, 1)} className="px-1 text-paper" aria-label="Déplacer à droite">→</button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-ink/20 text-sm text-ink-faint hover:border-ink/40"
                >
                  {uploading ? '…' : '+ Ajouter'}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <p className="mt-2 text-xs text-ink-faint">
                La première image est la photo principale. Glissez l’ordre avec les flèches au survol.
              </p>
            </>
          )}
        </Section>

        {/* Infos */}
        <Section title="Informations">
          <Grid>
            <Text label="Nom" value={form.name} onChange={(v) => set({ name: v })} full />
            <Text
              label="Slug (URL)"
              value={form.slug}
              onChange={(v) => set({ slug: v })}
              placeholder={slugify(form.name)}
              full
            />
            <label className="block sm:col-span-2">
              <span className="field-label">Description</span>
              <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={4} className="field resize-none" />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Informations sur la fabrication</span>
              <textarea value={form.making_info} onChange={(e) => set({ making_info: e.target.value })} rows={3} className="field resize-none" />
            </label>
          </Grid>
        </Section>

        {/* Prix & stock */}
        <Section title="Prix & disponibilité">
          <Grid>
            <Number label="Prix (centimes)" value={form.price_cents} onChange={(v) => set({ price_cents: v })} />
            <Number label="Stock" value={form.stock} onChange={(v) => set({ stock: v })} />
            <Number label="Max par commande" value={form.max_per_order} onChange={(v) => set({ max_per_order: v })} />
            <label className="block">
              <span className="field-label">Statut</span>
              <select value={form.status} onChange={(e) => set({ status: e.target.value as ProductStatus })} className="field">
                <option value="available">Disponible</option>
                <option value="sold">Vendu</option>
                <option value="coming_soon">Bientôt disponible</option>
              </select>
            </label>
            <label className="block">
              <span className="field-label">Catégorie</span>
              <select
                value={form.category_id ?? ''}
                onChange={(e) => set({ category_id: e.target.value || null })}
                className="field"
              >
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </Grid>
        </Section>

        {/* Caractéristiques */}
        <Section title="Caractéristiques">
          <Grid>
            <Text label="Dimensions" value={form.dimensions} onChange={(v) => set({ dimensions: v })} />
            <Number label="Poids (g)" value={form.weight_grams ?? 0} onChange={(v) => set({ weight_grams: v })} />
            <Text label="Matériaux" value={form.materials} onChange={(v) => set({ materials: v })} />
            <Text label="Couleurs" value={form.colors} onChange={(v) => set({ colors: v })} />
            <label className="block sm:col-span-2">
              <span className="field-label">Informations complémentaires</span>
              <textarea value={form.extra_info} onChange={(e) => set({ extra_info: e.target.value })} rows={2} className="field resize-none" />
            </label>
          </Grid>
        </Section>

        {/* SEO */}
        <Section title="Référencement (SEO)">
          <Grid>
            <Text label="Titre SEO" value={form.seo_title} onChange={(v) => set({ seo_title: v })} full />
            <label className="block sm:col-span-2">
              <span className="field-label">Meta description</span>
              <textarea value={form.seo_description} onChange={(e) => set({ seo_description: e.target.value })} rows={2} className="field resize-none" />
            </label>
          </Grid>
        </Section>

        {/* Options */}
        <Section title="Options">
          <div className="flex flex-wrap gap-6">
            <Checkbox label="Publié (visible sur la boutique)" checked={form.is_published} onChange={(v) => set({ is_published: v })} />
            <Checkbox label="Mise en avant (page d’accueil)" checked={form.is_featured} onChange={(v) => set({ is_featured: v })} />
          </div>
        </Section>

        <div className="sticky bottom-0 -mx-5 flex justify-end gap-3 border-t border-ink/10 bg-paper/90 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <button onClick={() => navigate('/admin/produits')} className="btn-ghost">Annuler</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── petits composants de formulaire ──────────────────────────────────── */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface p-5 ring-1 ring-ink/5">
      <h2 className="mb-4 font-display text-lg">{title}</h2>
      {children}
    </section>
  )
}
function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}
function Text({
  label, value, onChange, full, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; full?: boolean; placeholder?: string }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="field-label">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="field" />
    </label>
  )
}
function Number({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value || '0', 10))} className="field" />
    </label>
  )
}
function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-ink/30 text-celadon-deep focus:ring-celadon" />
      {label}
    </label>
  )
}
