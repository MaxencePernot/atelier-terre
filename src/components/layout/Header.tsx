import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '@/context/CartContext'
import RingMark from '@/components/ui/RingMark'

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/boutique', label: 'Boutique' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
]

export default function Header() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between sm:h-20">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5" aria-label="Atelier Terre — accueil">
          <RingMark className="h-7 w-7 text-celadon-deep" spinOnHover />
          <span className="font-display text-lg font-medium tracking-tight sm:text-xl">
            Atelier&nbsp;Terre
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `text-sm transition-colors hover:text-ink ${
                  isActive ? 'text-ink' : 'text-ink-soft'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Panier + burger */}
        <div className="flex items-center gap-1">
          <Link
            to="/panier"
            className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-ink/5"
            aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 7h12l-1 12H7L6 7Z" strokeLinejoin="round" />
              <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
            </svg>
            {count > 0 && (
              <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-celadon-deep px-1 text-[10px] font-semibold text-paper">
                {count}
              </span>
            )}
          </Link>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-ink/5 md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Nav mobile */}
      {open && (
        <nav className="border-t border-ink/10 bg-paper md:hidden" aria-label="Navigation mobile">
          <div className="shell flex flex-col py-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `border-b border-ink/5 py-3.5 text-base ${isActive ? 'text-ink' : 'text-ink-soft'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
