export function Logo({ tone = 'ink' }: { tone?: 'ink' | 'cream' }) {
  return (
    <span className={`brand-logo brand-logo--${tone}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="currentColor" />
        <circle cx="15.6" cy="18" r="8.6" stroke="#f6f1e7" strokeOpacity=".28" strokeWidth="1.2" />
        <circle cx="15.6" cy="18" r="4.9" stroke="#f6f1e7" strokeOpacity=".48" strokeWidth="1.2" />
        <circle cx="15.6" cy="18" r="1.8" fill="#e3563f" />
        <path
          d="M15.6 18l9.1-9.1"
          stroke="#e3563f"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M23.2 8.9h3.1v3.1"
          stroke="#e3563f"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="brand-word">RafRadar</span>
    </span>
  );
}
