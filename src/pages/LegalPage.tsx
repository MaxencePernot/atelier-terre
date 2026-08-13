import { useEffect, useState } from 'react'
import { fetchSetting } from '@/lib/queries'
import { useSeo } from '@/lib/seo'

interface LegalContent {
  terms: string
  privacy: string
  returns: string
  mentions: string
}
interface ShippingContent {
  delay: string
  zones: string
}

// Une seule page générique pilote toutes les pages d'information légale.
// Le contenu est modifiable depuis l'admin (table site_settings).
const CONFIG: Record<
  string,
  { title: string; settingKey: 'legal' | 'shipping'; field: string }
> = {
  cgv: { title: 'Conditions générales de vente', settingKey: 'legal', field: 'terms' },
  confidentialite: { title: 'Politique de confidentialité', settingKey: 'legal', field: 'privacy' },
  retours: { title: 'Retours & remboursements', settingKey: 'legal', field: 'returns' },
  'mentions-legales': { title: 'Mentions légales', settingKey: 'legal', field: 'mentions' },
  livraison: { title: 'Livraison', settingKey: 'shipping', field: 'delay' },
}

export default function LegalPage({ pageKey }: { pageKey: keyof typeof CONFIG }) {
  const conf = CONFIG[pageKey]
  const [body, setBody] = useState<string>('')

  useSeo({ title: `${conf.title} — Atelier Terre` })

  useEffect(() => {
    fetchSetting<LegalContent | ShippingContent>(conf.settingKey).then((data) => {
      if (!data) return
      if (conf.settingKey === 'shipping') {
        const s = data as ShippingContent
        setBody(`${s.delay}\n\nZones desservies : ${s.zones}`)
      } else {
        setBody((data as LegalContent)[conf.field as keyof LegalContent] ?? '')
      }
    })
  }, [pageKey])

  return (
    <div className="shell max-w-3xl py-12 lg:py-20">
      <h1 className="text-display-lg">{conf.title}</h1>
      <div className="mt-8 whitespace-pre-line text-lg leading-relaxed text-ink-soft">
        {body || 'Ce contenu sera bientôt disponible.'}
      </div>
    </div>
  )
}
