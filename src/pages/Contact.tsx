import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchSetting } from '@/lib/queries'
import { useSeo } from '@/lib/seo'

interface ContactInfo {
  email: string
  instagram: string
  address: string
}

export default function Contact() {
  const [info, setInfo] = useState<ContactInfo | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // honeypot anti-spam (doit rester vide)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useSeo({ title: 'Contact — Atelier Terre' })
  useEffect(() => {
    fetchSetting<ContactInfo>('contact').then(setInfo)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (website) return // bot détecté : on ignore silencieusement
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('sending')
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name: name.trim(), email: email.trim(), message: message.trim() })
    if (error) {
      setStatus('error')
    } else {
      setStatus('sent')
      setName(''); setEmail(''); setMessage('')
    }
  }

  return (
    <div className="shell py-12 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">Écrivez-nous</p>
          <h1 className="mt-3 text-display-lg">Contact</h1>
          <p className="mt-5 text-lg text-ink-soft">
            Une question sur une pièce, une commande spéciale ou une collaboration ? Ce formulaire
            nous parvient directement.
          </p>
          {info && (
            <ul className="mt-8 space-y-3 text-sm">
              <li><span className="text-ink-faint">E-mail —</span> <a href={`mailto:${info.email}`} className="hover:underline">{info.email}</a></li>
              <li><span className="text-ink-faint">Instagram —</span> <a href={info.instagram} target="_blank" rel="noreferrer" className="hover:underline">@atelier.terre</a></li>
              <li><span className="text-ink-faint">Atelier —</span> {info.address}</li>
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-surface p-6 ring-1 ring-ink/5 sm:p-8">
          {status === 'sent' ? (
            <div className="py-10 text-center">
              <p className="font-display text-2xl">Message envoyé</p>
              <p className="mt-2 text-ink-soft">Nous vous répondrons rapidement. Merci !</p>
              <button type="button" onClick={() => setStatus('idle')} className="btn-quiet mt-4">
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="field-label">Nom</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="field" required />
              </label>
              <label className="block">
                <span className="field-label">E-mail</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required />
              </label>
              <label className="block">
                <span className="field-label">Message</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="field resize-none" required />
              </label>
              {/* Honeypot : champ invisible pour piéger les bots */}
              <input
                type="text" tabIndex={-1} autoComplete="off" value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden" aria-hidden="true"
              />
              {status === 'error' && (
                <p className="text-sm text-clay">L’envoi a échoué. Réessayez dans un instant.</p>
              )}
              <button disabled={status === 'sending'} className="btn-primary w-full">
                {status === 'sending' ? 'Envoi…' : 'Envoyer le message'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
