export default function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-faint" role="status">
      <svg viewBox="0 0 50 50" className="h-8 w-8 animate-spin" aria-hidden="true">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
        <path d="M25 5 a20 20 0 0 1 20 20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  )
}
