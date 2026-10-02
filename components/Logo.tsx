/** The Dalil mark: an eight-point star holding a compass needle. "Dalil" means guide. */
export function LogoMark({ size = 34, onDark = false }: { size?: number; onDark?: boolean }) {
  const body = onDark ? "#e0a43a" : "#1b2540";
  const face = onDark ? "#1b2540" : "#efe6d2";
  const needle = onDark ? "#efe6d2" : "#b83a24";
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" aria-hidden>
      <g transform="translate(75 75)">
        <rect x="-50" y="-50" width="100" height="100" rx="6" fill={body} />
        <rect x="-50" y="-50" width="100" height="100" rx="6" fill={body} transform="rotate(45)" />
        <circle r="35" fill={face} />
        <path d="M0 -27 L7 -7 L27 0 L7 7 L0 27 L-7 7 L-27 0 L-7 -7 Z" fill={needle} />
        <circle r="5" fill={face} />
      </g>
    </svg>
  );
}

export function Logo({ onDark = false, size = 34 }: { onDark?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} onDark={onDark} />
      <span className="flex items-baseline gap-2">
        <span className={`font-display text-[24px] leading-none font-bold tracking-tight ${onDark ? "text-card" : "text-ink"}`}>Dalil</span>
        <span className={`text-[18px] leading-none font-bold ${onDark ? "text-gold-bright" : "text-stamp"}`} lang="ar" dir="rtl">
          دليل
        </span>
      </span>
    </span>
  );
}
