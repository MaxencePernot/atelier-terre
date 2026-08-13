import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Spinner from '@/components/ui/Spinner'
import RingMark from '@/components/ui/RingMark'

const NAV = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/produits', label: 'Produits' },
  { to: '/admin/commandes', label: 'Commandes' },
]

export default function AdminLayout() {
  const { isAdmin, loading, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading) return <Spinner label="Vérification de l’accès…" />
  if (!isAdmin) return <Navigate to="/admin/connexion" replace />

  async function handleSignOut() {
    await signOut()
    navigate('/admin/connexion')
  }

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="border-b border-ink/10 bg-paper-deep lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-5 lg:block">
          <div className="flex items-center gap-2.5">
            <RingMark className="h-6 w-6 text-celadon-deep" />
            <span className="font-display text-lg font-medium">Admin</span>
          </div>
          <nav className="mt-0 flex gap-1 lg:mt-8 lg:flex-col">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-sm transition-colors ${
                    isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-ink/5'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="hidden p-5 lg:block">
          <a href="/" className="btn-quiet">← Voir la boutique</a>
          <button onClick={handleSignOut} className="btn-quiet mt-3 block">
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <main className="p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminIndexGuard() {
  // Redirige /admin non authentifié vers la connexion (utilisé si besoin).
  const { isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  return isAdmin ? <Outlet /> : <Navigate to="/admin/connexion" replace />
}
