import { Link } from 'react-router-dom'
import RingMark from '@/components/ui/RingMark'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper-deep">
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <RingMark className="h-6 w-6 text-celadon-deep" />
            <span className="font-display text-lg font-medium">Atelier Terre</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
            Céramiques tournées et émaillées à la main, façonnées une à une dans notre atelier.
          </p>
        </div>

        <nav aria-label="Boutique">
          <h3 className="eyebrow mb-4">Boutique</h3>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li><Link to="/boutique" className="hover:text-ink">Toutes les pièces</Link></li>
            <li><Link to="/boutique/demo-vases" className="hover:text-ink">Vases</Link></li>
            <li><Link to="/boutique/demo-bols" className="hover:text-ink">Bols</Link></li>
            <li><Link to="/boutique/demo-tasses" className="hover:text-ink">Tasses</Link></li>
          </ul>
        </nav>

        <nav aria-label="Atelier">
          <h3 className="eyebrow mb-4">Atelier</h3>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li><Link to="/a-propos" className="hover:text-ink">À propos</Link></li>
            <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
            <li><Link to="/livraison" className="hover:text-ink">Livraison</Link></li>
            <li><Link to="/retours" className="hover:text-ink">Retours</Link></li>
          </ul>
        </nav>

        <nav aria-label="Informations légales">
          <h3 className="eyebrow mb-4">Informations</h3>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li><Link to="/cgv" className="hover:text-ink">CGV</Link></li>
            <li><Link to="/confidentialite" className="hover:text-ink">Confidentialité</Link></li>
            <li><Link to="/mentions-legales" className="hover:text-ink">Mentions légales</Link></li>
          </ul>
        </nav>
      </div>

      <div className="hairline">
        <div className="shell flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} Atelier Terre. Fait main.</p>
          <p>Paiement sécurisé par Stripe.</p>
        </div>
      </div>
    </footer>
  )
}
