import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useSeo } from '@/lib/seo'
import RingMark from '@/components/ui/RingMark'

export default function Login() {
  const { signIn, isAdmin, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useSeo({ title: 'Administration — Atelier Terre' })

  if (!loading && isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) setError('Identifiants incorrects.')
    else navigate('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <RingMark className="h-8 w-8 text-celadon-deep" />
          <span className="font-display text-xl font-medium">Atelier Terre</span>
        </div>
        <div className="rounded-3xl bg-surface p-8 shadow-soft ring-1 ring-ink/5">
          <h1 className="font-display text-2xl">Administration</h1>
          <p className="mt-1 text-sm text-ink-soft">Connectez-vous pour gérer la boutique.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">E-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required />
            </label>
            <label className="block">
              <span className="field-label">Mot de passe</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required />
            </label>
            {error && <p className="text-sm text-clay">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Accès réservé. Créez le compte dans Supabase puis ajoutez-le à la table admin_users.
        </p>
      </div>
    </div>
  )
}
