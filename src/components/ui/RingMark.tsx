interface RingMarkProps {
  className?: string
  /** Anime un léger tour lent au survol du parent .group */
  spinOnHover?: boolean
}

/** Cercles concentriques évoquant les traces des doigts sur le tour du potier. */
export default function RingMark({ className = '', spinOnHover }: RingMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`${className} ${
        spinOnHover ? 'transition-transform duration-[1200ms] ease-out-soft group-hover:rotate-45' : ''
      }`}
      fill="none"
    >
      <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1" opacity="0.9" />
      <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" opacity="0.65" />
      <circle cx="50" cy="50" r="31" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="1" opacity="0.28" />
    </svg>
  )
}
