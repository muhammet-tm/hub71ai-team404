/**
 * The Dalil mark: a paper plane folded from a map, with a dashed trail.
 * Redrawn as SVG from the team's chosen logo artwork.
 */
export function PlaneMark({ size = 34, trail = true, title }: { size?: number; trail?: boolean; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      {/* tail fold */}
      <path d="M44.7 63.9 L58.6 73.6 L46.8 84.9 Z" fill="#f58a5c" />
      {/* upper wing, with the map's fold lines */}
      <path d="M98.1 9.7 L6.6 47.3 L44.7 63.9 Z" fill="#df5527" />
      <g stroke="#f9d9c4" strokeWidth="1.6" strokeLinecap="round">
        <path d="M28.9 41 L53.4 56" />
        <path d="M51.3 32.3 L64.4 46.8" />
        <path d="M73.6 23.1 L78.1 33.9" />
      </g>
      {/* lower wing */}
      <path d="M98.1 9.7 L44.7 63.9 L69.2 87 Z" fill="#a23617" />
      {trail ? (
        <path d="M2.5 86 Q15 97 32 81" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="5 5.5" />
      ) : null}
    </svg>
  );
}

export function Logo({ onDark = false, size = 36 }: { onDark?: boolean; size?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${onDark ? "text-card" : "text-ink"}`}>
      <PlaneMark size={size} />
      <span className="flex items-baseline gap-2">
        <span className="font-wordmark text-[19px] leading-none font-extrabold tracking-[0.02em] uppercase">Dalil</span>
        <span className={`text-[19px] leading-none font-bold ${onDark ? "text-flame" : "text-stamp"}`} lang="ar" dir="rtl">
          دليل
        </span>
      </span>
    </span>
  );
}
