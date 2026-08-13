import { Link } from 'react-router-dom'
import { useSeo } from '@/lib/seo'
import RingMark from '@/components/ui/RingMark'

export default function NotFound() {
  useSeo({ title: 'Page introuvable — Atelier Terre' })
  return (
    <div className="shell py-28 text-center">
      <RingMark className="mx-auto h-16 w-16 text-celadon-deep/50" />
      <h1 className="mt-6 text-display-lg">Page introuvable</h1>
      <p className="mt-3 text-ink-soft">Cette page s’est peut-être brisée à la cuisson.</p>
      <Link to="/" className="btn-primary mt-6">Retour à l’accueil</Link>
    </div>
  )
}
