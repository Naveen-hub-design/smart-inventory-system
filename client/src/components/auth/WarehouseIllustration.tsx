export default function WarehouseIllustration() {
  return (
    <div className="relative mx-auto max-w-[340px]">
      <svg viewBox="0 0 420 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" role="img" aria-label="Warehouse and supply chain illustration">
        <defs>
          <radialGradient id="whGroundGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#60A5FA" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="whBuildGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1C2A5C" />
            <stop offset="100%" stopColor="#0E1638" />
          </linearGradient>
          <linearGradient id="whDoorGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <filter id="whSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* dotted orbit path */}
        <circle cx="210" cy="128" r="66" stroke="rgba(148,163,184,0.45)" strokeWidth="1.3" strokeDasharray="2 9" strokeLinecap="round" />

        {/* glowing ground platform */}
        <ellipse cx="210" cy="150" rx="150" ry="30" fill="url(#whGroundGlow)" />
        <ellipse cx="210" cy="150" rx="150" ry="30" stroke="rgba(96,165,250,0.32)" strokeWidth="1.3" />

        {/* warehouse building */}
        <path d="M138 150 L138 82 L210 46 L282 82 L282 150 Z" fill="url(#whBuildGrad)" stroke="rgba(96,165,250,0.55)" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="210" y1="46" x2="210" y2="82" stroke="rgba(96,165,250,0.35)" strokeWidth="1.3" />

        {/* window grid */}
        <rect x="156" y="92" width="13" height="15" rx="2" fill="rgba(96,165,250,0.30)" />
        <rect x="176" y="92" width="13" height="15" rx="2" fill="rgba(96,165,250,0.30)" />
        <rect x="231" y="92" width="13" height="15" rx="2" fill="rgba(96,165,250,0.30)" />
        <rect x="251" y="92" width="13" height="15" rx="2" fill="rgba(96,165,250,0.30)" />

        {/* glowing doorway */}
        <rect x="196" y="114" width="28" height="36" rx="3" fill="url(#whDoorGrad)" opacity="0.85" filter="url(#whSoftGlow)" />
        <rect x="196" y="114" width="28" height="36" rx="3" stroke="rgba(96,165,250,0.8)" strokeWidth="1.3" />

        {/* stacked pallets */}
        <g transform="translate(100 128)">
          <rect x="0" y="18" width="32" height="15" rx="2" fill="rgba(59,130,246,0.28)" stroke="rgba(96,165,250,0.6)" strokeWidth="1.2" />
          <rect x="4" y="7" width="24" height="12" rx="2" fill="rgba(96,165,250,0.24)" stroke="rgba(96,165,250,0.55)" strokeWidth="1.2" />
        </g>

        {/* delivery truck */}
        <g transform="translate(292 130)">
          <rect x="0" y="6" width="44" height="17" rx="4" fill="rgba(59,130,246,0.26)" stroke="rgba(96,165,250,0.6)" strokeWidth="1.3" />
          <rect x="44" y="1" width="15" height="22" rx="3" fill="rgba(96,165,250,0.22)" stroke="rgba(96,165,250,0.5)" strokeWidth="1.3" />
          <circle cx="13" cy="24" r="4.6" fill="#0E1638" stroke="rgba(96,165,250,0.6)" strokeWidth="1.1" />
          <circle cx="46" cy="24" r="4.6" fill="#0E1638" stroke="rgba(96,165,250,0.6)" strokeWidth="1.1" />
        </g>

        {/* forklift moving a box */}
        <g transform="translate(156 138)">
          <rect x="4" y="5" width="17" height="9" rx="2" fill="rgba(59,130,246,0.30)" stroke="rgba(96,165,250,0.7)" strokeWidth="1.2" />
          <path d="M9 14 L9 3 L1 3 M9 7 L23 7" stroke="rgba(96,165,250,0.7)" strokeWidth="1.4" fill="none" />
          <rect x="1" y="-5" width="11" height="7" rx="1.5" fill="rgba(96,165,250,0.35)" stroke="rgba(96,165,250,0.7)" strokeWidth="1.1" />
          <circle cx="8" cy="16" r="2.8" fill="#0E1638" stroke="rgba(96,165,250,0.6)" strokeWidth="1" />
        </g>
      </svg>
    </div>
  )
}
