// Decorative icons and graphics. Each sits next to text that says the same thing, so they are
// hidden from screen readers.

export function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The app's mark in the header: a lens with a check mark in it. */
export function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 44 44" aria-hidden="true">
      <rect width="44" height="44" rx="11" fill="#fff" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="9.5" stroke="currentColor" strokeWidth="3" />
        <path d="M27.5 27.5 34 34" stroke="currentColor" strokeWidth="3.5" />
        <path d="M15.8 20.3l3 3 5.2-5.6" stroke="#0c6b41" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

/** For the empty state: three offer cards under a lens. */
export function EmptyIllustration() {
  return (
    <svg className="empty-illustration" viewBox="0 0 168 120" aria-hidden="true">
      {[8, 44, 80].map((y, index) => (
        <g key={y} opacity={1 - index * 0.25}>
          <rect x="14" y={y} width="112" height="28" rx="7" fill="#e9edfc" />
          <rect x="24" y={y + 8} width="40" height="5" rx="2.5" fill="#2440c4" opacity="0.55" />
          <rect x="24" y={y + 17} width="64" height="4" rx="2" fill="#b5bed3" />
          <circle cx="110" cy={y + 14} r="6" fill="#e3f4ea" stroke="#0c6b41" strokeWidth="1.5" />
        </g>
      ))}
      <circle cx="116" cy="62" r="26" fill="#fff" fillOpacity="0.7" stroke="#2440c4" strokeWidth="5" />
      <path d="M135 82l18 19" stroke="#2440c4" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
