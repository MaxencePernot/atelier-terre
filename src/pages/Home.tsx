import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFeatured, fetchProducts, fetchSetting } from '@/lib/queries'
import type { Product } from '@/lib/types'
import { useSeo } from '@/lib/seo'
import ProductCard from '@/components/product/ProductCard'
import RingMark from '@/components/ui/RingMark'
import Spinner from '@/components/ui/Spinner'

interface HomeContent {
  hero_eyebrow: string
  hero_title: string
  hero_text: string
  story_title: string
  story_text: string
}

export default function Home() {
  const [content, setContent] = useState<HomeContent | null>(null)
  const [featured, setFeatured] = useState<Product[]>([])
  const [latest, setLatest] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useSeo({
    title: 'Atelier Terre — Poteries artisanales faites main',
    description:
      'Céramiques tournées et émaillées à la main. Vases, bols, tasses et pièces uniques façonnés dans notre atelier.',
  })

  useEffect(() => {
    Promise.all([
      fetchSetting<HomeContent>('home'),
      fetchFeatured(4),
      fetchProducts({ sort: 'newest' }),
    ])
      .then(([c, f, all]) => {
        setContent(c)
        setFeatured(f)
        setLatest(all.slice(0, 3))
      })
      .finally(() => setLoading(false))
  }, [])

  const hero = content ?? {
    hero_eyebrow: 'Céramique faite main',
    hero_title: 'La terre, tournée à la main',
    hero_text:
      'Des pièces façonnées une à une dans notre atelier, entre le geste du tour et la patience du feu.',
    story_title: 'L’atelier',
    story_text: '',
  }

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="rings absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
        <div className="shell grid items-center gap-10 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-24">
          <div className="stagger max-w-xl">
            <p className="eyebrow">{hero.hero_eyebrow}</p>
            <h1 className="mt-4 text-display-xl">{hero.hero_title}</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              {hero.hero_text}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/boutique" className="btn-primary">
                Découvrir les poteries
              </Link>
              <Link to="/a-propos" className="btn-ghost">
                L’atelier
              </Link>
            </div>
          </div>

          {/* Composition visuelle du hero */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-celadon-wash shadow-lift ring-1 ring-ink/5">
              <img
                src="/demo/vase.svg"
                alt="Vase en grès céladon tourné à la main"
                className="h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden aspect-square w-40 overflow-hidden rounded-2xl bg-surface shadow-lift ring-1 ring-ink/5 sm:block">
              <img src="/demo/bol.svg" alt="Bol en grès ocre" className="h-full w-full object-cover" />
            </div>
            <RingMark className="absolute -right-4 -top-4 hidden h-24 w-24 text-celadon-deep/40 sm:block" />
          </div>
        </div>
      </section>

      {/* ── SÉLECTION ──────────────────────────────────────────────────── */}
      <section className="shell py-8 lg:py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow">La sélection</p>
            <h2 className="mt-2 text-display-md">Pièces mises en avant</h2>
          </div>
          <Link to="/boutique" className="btn-quiet hidden sm:inline-flex">
            Toute la boutique →
          </Link>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── SAVOIR-FAIRE ───────────────────────────────────────────────── */}
      <section className="mt-12 bg-paper-deep py-16 lg:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 grid grid-cols-2 gap-4 lg:order-1">
            {[
              ['/demo/tasse.svg', 'Le tournage'],
              ['/demo/assiette.svg', 'L’émaillage'],
              ['/demo/coupelle.svg', 'Le façonnage'],
              ['/demo/objet.svg', 'La cuisson'],
            ].map(([src, label]) => (
              <figure key={label} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/5">
                <img src={src} alt={label} loading="lazy" className="aspect-square w-full object-cover" />
              </figure>
            ))}
          </div>
          <div className="order-1 max-w-md lg:order-2">
            <p className="eyebrow">Le savoir-faire</p>
            <h2 className="mt-2 text-display-md">{hero.story_title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-soft">
              {hero.story_text ||
                'Chaque poterie naît d’une motte de grès et de quelques minutes sur le tour. Nous cherchons des formes simples, des émaux vivants, des objets qui vieillissent bien.'}
            </p>
            <ul className="mt-8 space-y-4">
              {[
                ['Tournage', 'Chaque forme est montée à la main sur le tour.'],
                ['Émaillage', 'Émaux préparés à l’atelier, appliqués un à un.'],
                ['Cuisson', 'Grès cuit à haute température, 1260°C.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <RingMark className="mt-0.5 h-6 w-6 shrink-0 text-celadon-deep" />
                  <span>
                    <span className="font-medium">{t}.</span>{' '}
                    <span className="text-ink-soft">{d}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── DERNIÈRES CRÉATIONS ────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="shell py-16 lg:py-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow">Fraîchement sorties du four</p>
              <h2 className="mt-2 text-display-md">Dernières créations</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── INSTAGRAM / RÉSEAUX ────────────────────────────────────────── */}
      <section className="shell pb-8">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-ink px-6 py-14 text-center text-paper">
          <RingMark className="h-10 w-10 text-celadon" />
          <h2 className="text-display-md">Suivez l’atelier</h2>
          <p className="max-w-md text-paper/70">
            Coulisses, fournées et nouveautés, publiées au fil des cuissons.
          </p>
          <a
            href="https://instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="btn mt-2 bg-paper text-ink hover:bg-celadon hover:text-paper"
          >
            @atelier.terre sur Instagram
          </a>
        </div>
      </section>
    </>
  )
}
