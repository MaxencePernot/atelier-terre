import type { ProductStatus } from '@/lib/types'

const MAP: Record<ProductStatus, { label: string; cls: string }> = {
  available: { label: 'Disponible', cls: 'bg-celadon-wash text-celadon-deep' },
  sold: { label: 'Vendu', cls: 'bg-ink text-paper' },
  coming_soon: { label: 'Bientôt', cls: 'bg-ochre/15 text-ochre' },
}

export default function StatusBadge({ status }: { status: ProductStatus }) {
  const { label, cls } = MAP[status]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
