import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSetting } from '@/lib/queries'
import { useSeo } from '@/lib/seo'
import RingMark from '@/components/ui/RingMark'

interface AboutContent {
  title: string
  intro: string
  story: string
  process: string
}

export default function About() {
  const [c, setC] = useState<AboutContent | null>(null)
  useSeo({
    title: 'À propos — Atelier Terre',
    description: 'L’histoire, la démarche et le processus de fabrication de l’atelier.',
  })
  useEffect(() => {
    fetchSetting<AboutContent>('about').then(setC)
  }, [])

  const content = c ?? {
    title: 'À propos',
    intro: 'Un petit atelier de céramique où chaque pièce est pensée, tournée et émaillée à la main.',
    story: '',
    process: '',
  }

  return (
    <div className="shell py-12 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">L’atelier</p>
          <h1 className="mt-3 text-display-lg">{content.title}</h1>
          <p className="mt-6 text-xl leading-relaxed text-ink-soft">{content.intro}</p>

          {content.story && (
            <div className="mt-10">
              <h2 className="text-display-md">Notre histoire</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{content.story}</p>
            </div>
          )}
          {content.process && (
            <div className="mt-10">
              <h2 className="text-display-md">Le processus</h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{content.process}</p>
            </div>
          )}

          <Link to="/boutique" className="btn-primary mt-10">
            Découvrir les pièces
          </Link>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl bg-celadon-wash ring-1 ring-ink/5">
            <img src="/demo/objet.svg" alt="Pièce de l’atelier" className="aspect-[4/5] w-full object-cover" />
          </div>
          <RingMark className="absolute -bottom-5 -left-5 hidden h-24 w-24 text-celadon-deep/40 lg:block" />
        </div>
      </div>
    </div>
  )
}
