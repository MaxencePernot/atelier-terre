// Petit hook SEO sans dépendance : met à jour <title> et les meta au montage.
import { useEffect } from 'react'

interface SeoProps {
  title: string
  description?: string
  image?: string
  jsonLd?: Record<string, unknown>
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    const [key, val] = attr.split('=')
    el.setAttribute(key, val.replace(/"/g, ''))
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

export function useSeo({ title, description, image, jsonLd }: SeoProps) {
  useEffect(() => {
    document.title = title
    if (description) {
      setMeta('meta[name="description"]', 'name="description"', description)
      setMeta('meta[property="og:description"]', 'property="og:description"', description)
    }
    setMeta('meta[property="og:title"]', 'property="og:title"', title)
    if (image) setMeta('meta[property="og:image"]', 'property="og:image"', image)

    // Données structurées (Schema.org) injectées / nettoyées par page.
    let script = document.getElementById('page-jsonld')
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script')
        script.id = 'page-jsonld'
        ;(script as HTMLScriptElement).type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(jsonLd)
    } else if (script) {
      script.remove()
    }
    return () => {
      const s = document.getElementById('page-jsonld')
      if (s) s.remove()
    }
  }, [title, description, image, jsonLd])
}
