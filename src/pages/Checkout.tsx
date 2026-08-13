import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import { computeShipping, fetchShipping } from '@/lib/queries'
import type { ShippingSettings } from '@/lib/types'
import { formatPrice } from '@/lib/format'
import { useSeo } from '@/lib/seo'

const STEPS = ['Informations', 'Livraison', 'Paiement'] as const
type StepIndex = 0 | 1 | 2

interface Form {
  first_name: string
  last_name: string
  email: string
  phone: string
  line1: string
  line2: string
  postal_code: string
  city: string
  country: string
  billing_same: boolean
  b_line1: string
  b_postal_code: string
  b_city: string
  b_country: string
}

const EMPTY: Form = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  postal_code: '',
  city: '',
  country: 'France',
  billing_same: true,
  b_line1: '',
  b_postal_code: '',
  b_city: '',
  b_country: 'France',
}

export default function Checkout() {
  const { lines, subtotalCents, clear } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState<StepIndex>(0)
  const [form, setForm] = useState<Form>(EMPTY)
  const [shipping, setShipping] = useState<ShippingSettings | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useSeo({ title: 'Commande — Atelier Terre' })
  useEffect(() => {
    fetchShipping().then(setShipping)
  }, [])

  useEffect(() => {
    if (lines.length === 0) navigate('/panier')
  }, [lines.length, navigate])

  const shippingCents = shipping ? computeShipping(subtotalCents, shipping) : 0
  const totalCents = subtotalCents + shippingCents

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }))

  const contactValid = useMemo(
    () =>
      form.first_name.trim() &&
      form.last_name.trim() &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email),
    [form],
  )
  const shippingValid = useMemo(
    () => form.line1.trim() && form.postal_code.trim() && form.city.trim() && form.country.trim(),
    [form],
  )

  async function handlePay() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          customer: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone || null,
          },
          shipping_address: {
            first_name: form.first_name,
            last_name: form.last_name,
            line1: form.line1,
            line2: form.line2 || undefined,
            postal_code: form.postal_code,
            city: form.city,
            country: form.country,
            phone: form.phone || undefined,
          },
          billing_address: form.billing_same
            ? null
            : {
                line1: form.b_line1,
                postal_code: form.b_postal_code,
                city: form.b_city,
                country: form.b_country,
              },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Le paiement n’a pas pu être initié.')
      }
      const { url } = await res.json()
      // On vide le panier : la commande vit désormais côté serveur.
      clear()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.')
      setSubmitting(false)
    }
  }

  return (
    <div className="shell py-10 lg:py-14">
      <Link to="/panier" className="btn-quiet mb-6">
        ← Retour au panier
      </Link>

      {/* Stepper */}
      <ol className="mb-10 flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                i <= step ? 'bg-ink text-paper' : 'bg-ink/10 text-ink-faint'
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? 'font-medium text-ink' : 'text-ink-faint'}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-2 h-px w-8 bg-ink/15" />}
          </li>
        ))}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {/* Étape 1 — Informations */}
          {step === 0 && (
            <section className="animate-fade-up space-y-4">
              <h2 className="text-display-md">Vos informations</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Prénom" value={form.first_name} onChange={(v) => set({ first_name: v })} />
                <Field label="Nom" value={form.last_name} onChange={(v) => set({ last_name: v })} />
              </div>
              <Field
                label="Adresse e-mail"
                type="email"
                value={form.email}
                onChange={(v) => set({ email: v })}
              />
              <Field
                label="Téléphone (optionnel)"
                value={form.phone}
                onChange={(v) => set({ phone: v })}
              />
              <button
                disabled={!contactValid}
                onClick={() => setStep(1)}
                className="btn-primary mt-2"
              >
                Continuer
              </button>
            </section>
          )}

          {/* Étape 2 — Livraison */}
          {step === 1 && (
            <section className="animate-fade-up space-y-4">
              <h2 className="text-display-md">Adresse de livraison</h2>
              <Field label="Adresse" value={form.line1} onChange={(v) => set({ line1: v })} />
              <Field
                label="Complément (optionnel)"
                value={form.line2}
                onChange={(v) => set({ line2: v })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Code postal"
                  value={form.postal_code}
                  onChange={(v) => set({ postal_code: v })}
                />
                <Field label="Ville" value={form.city} onChange={(v) => set({ city: v })} />
              </div>
              <Field label="Pays" value={form.country} onChange={(v) => set({ country: v })} />

              <label className="flex items-center gap-2 pt-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.billing_same}
                  onChange={(e) => set({ billing_same: e.target.checked })}
                  className="h-4 w-4 rounded border-ink/30 text-celadon-deep focus:ring-celadon"
                />
                L’adresse de facturation est identique
              </label>

              {!form.billing_same && (
                <div className="space-y-4 rounded-2xl border border-ink/10 p-4">
                  <p className="text-sm font-medium">Adresse de facturation</p>
                  <Field label="Adresse" value={form.b_line1} onChange={(v) => set({ b_line1: v })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Code postal"
                      value={form.b_postal_code}
                      onChange={(v) => set({ b_postal_code: v })}
                    />
                    <Field label="Ville" value={form.b_city} onChange={(v) => set({ b_city: v })} />
                  </div>
                  <Field label="Pays" value={form.b_country} onChange={(v) => set({ b_country: v })} />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="btn-ghost">
                  Retour
                </button>
                <button disabled={!shippingValid} onClick={() => setStep(2)} className="btn-primary">
                  Continuer
                </button>
              </div>
            </section>
          )}

          {/* Étape 3 — Paiement */}
          {step === 2 && (
            <section className="animate-fade-up space-y-5">
              <h2 className="text-display-md">Paiement</h2>
              <div className="rounded-2xl border border-ink/10 bg-paper-deep p-5 text-sm">
                <p className="font-medium">{form.first_name} {form.last_name}</p>
                <p className="text-ink-soft">{form.email}</p>
                <p className="mt-2 text-ink-soft">
                  {form.line1}
                  {form.line2 ? `, ${form.line2}` : ''}, {form.postal_code} {form.city}, {form.country}
                </p>
                <button onClick={() => setStep(1)} className="btn-quiet mt-2">
                  Modifier
                </button>
              </div>

              <p className="text-sm text-ink-soft">
                Vous serez redirigé·e vers la page de paiement sécurisée Stripe. Aucune donnée bancaire
                n’est stockée sur ce site.
              </p>

              {error && (
                <p className="rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{error}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost" disabled={submitting}>
                  Retour
                </button>
                <button onClick={handlePay} disabled={submitting} className="btn-primary min-w-[220px]">
                  {submitting ? 'Redirection…' : `Payer ${formatPrice(totalCents)}`}
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Récapitulatif */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-surface p-6 ring-1 ring-ink/5">
            <h2 className="font-display text-xl">Votre commande</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 text-sm">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-paper-deep">
                    {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{l.name}</p>
                    <p className="text-ink-faint">×{l.quantity}</p>
                  </div>
                  <span>{formatPrice(l.priceCents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="hairline mt-4 space-y-2 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Sous-total</dt>
                <dd>{formatPrice(subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Livraison</dt>
                <dd>{shippingCents === 0 ? 'Offerte' : formatPrice(shippingCents)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(totalCents)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </label>
  )
}
