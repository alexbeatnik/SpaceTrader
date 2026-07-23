import type { ShipTypeId } from '@game/index'

interface Props {
  type: ShipTypeId
  size?: number
  /** Mirror horizontally (e.g. to face an opponent). */
  flip?: boolean
  /** Accent colour override. */
  accent?: string
}

// Each ship is drawn in a 100x100 viewBox, nose pointing right.
// Distinct silhouettes + palettes give every hull its own identity.
const HULLS: Record<
  ShipTypeId,
  { accent: string; body: React.ReactNode }
> = {
  flea: {
    accent: '#8b95c4',
    body: (
      <>
        <polygon points="20,50 60,42 78,50 60,58" fill="#2a3160" stroke="#8b95c4" />
        <circle cx="40" cy="50" r="6" fill="#8b95c4" />
      </>
    )
  },
  gnat: {
    accent: '#4fd1ff',
    body: (
      <>
        <polygon points="18,50 70,40 85,50 70,60" fill="#1b2145" stroke="#4fd1ff" />
        <polygon points="30,42 44,26 50,42" fill="#243056" stroke="#4fd1ff" />
        <polygon points="30,58 44,74 50,58" fill="#243056" stroke="#4fd1ff" />
        <circle cx="60" cy="50" r="5" fill="#4fd1ff" />
      </>
    )
  },
  dragonfly: {
    accent: '#3fe0d0',
    body: (
      <>
        <polygon points="16,50 78,45 90,50 78,55" fill="#0e3330" stroke="#3fe0d0" />
        <polygon points="36,45 20,24 54,42" fill="#123f3a" stroke="#3fe0d0" />
        <polygon points="36,55 20,76 54,58" fill="#123f3a" stroke="#3fe0d0" />
        <polygon points="46,46 34,32 58,44" fill="#0c2b28" stroke="#3fe0d0" />
        <polygon points="46,54 34,68 58,56" fill="#0c2b28" stroke="#3fe0d0" />
        <circle cx="66" cy="50" r="4" fill="#3fe0d0" />
      </>
    )
  },
  firefly: {
    accent: '#38e08a',
    body: (
      <>
        <ellipse cx="50" cy="50" rx="34" ry="14" fill="#12331f" stroke="#38e08a" />
        <polygon points="84,50 66,44 66,56" fill="#38e08a" />
        <rect x="26" y="44" width="18" height="12" rx="3" fill="#0c2417" stroke="#38e08a" />
      </>
    )
  },
  mosquito: {
    accent: '#ff8a4a',
    body: (
      <>
        <polygon points="16,50 74,44 88,50 74,56" fill="#3a2113" stroke="#ff8a4a" />
        <polygon points="34,44 22,30 46,40" fill="#4a2a18" stroke="#ff8a4a" />
        <polygon points="34,56 22,70 46,60" fill="#4a2a18" stroke="#ff8a4a" />
        <circle cx="62" cy="50" r="4" fill="#ff8a4a" />
      </>
    )
  },
  locust: {
    accent: '#9fd94a',
    body: (
      <>
        <rect x="22" y="38" width="46" height="24" rx="6" fill="#2a3512" stroke="#9fd94a" />
        <polygon points="80,50 68,44 68,56" fill="#9fd94a" />
        <polygon points="30,38 22,26 44,36" fill="#354618" stroke="#9fd94a" />
        <polygon points="30,62 22,74 44,64" fill="#354618" stroke="#9fd94a" />
        <rect x="28" y="43" width="8" height="14" fill="#161f08" stroke="#9fd94a" />
        <rect x="40" y="43" width="8" height="14" fill="#161f08" stroke="#9fd94a" />
        <rect x="52" y="43" width="8" height="14" fill="#161f08" stroke="#9fd94a" />
      </>
    )
  },
  bumblebee: {
    accent: '#ffc04a',
    body: (
      <>
        <ellipse cx="48" cy="50" rx="32" ry="17" fill="#3a2f10" stroke="#ffc04a" />
        <line x1="30" y1="38" x2="30" y2="62" stroke="#ffc04a" strokeWidth="2" />
        <line x1="44" y1="35" x2="44" y2="65" stroke="#ffc04a" strokeWidth="2" />
        <polygon points="82,50 66,43 66,57" fill="#ffc04a" />
      </>
    )
  },
  beetle: {
    accent: '#a06bff',
    body: (
      <>
        <rect x="20" y="34" width="52" height="32" rx="10" fill="#241542" stroke="#a06bff" />
        <polygon points="80,50 70,44 70,56" fill="#a06bff" />
        <rect x="28" y="40" width="10" height="20" rx="2" fill="#160b2e" stroke="#a06bff" />
        <rect x="44" y="40" width="10" height="20" rx="2" fill="#160b2e" stroke="#a06bff" />
      </>
    )
  },
  mantis: {
    accent: '#ff7a3c',
    body: (
      <>
        <polygon points="12,50 76,42 92,50 76,58" fill="#3a2010" stroke="#ff7a3c" />
        <polygon points="30,44 8,30 30,40" fill="#ff7a3c" />
        <polygon points="30,56 8,70 30,60" fill="#ff7a3c" />
        <polygon points="40,42 30,24 58,40" fill="#4a2814" stroke="#ff7a3c" />
        <polygon points="40,58 30,76 58,60" fill="#4a2814" stroke="#ff7a3c" />
        <circle cx="60" cy="50" r="4" fill="#ff7a3c" />
      </>
    )
  },
  hornet: {
    accent: '#ff5d6c',
    body: (
      <>
        <polygon points="14,50 72,38 92,50 72,62" fill="#3a1420" stroke="#ff5d6c" />
        <polygon points="34,38 20,20 52,34" fill="#4a1a28" stroke="#ff5d6c" />
        <polygon points="34,62 20,80 52,66" fill="#4a1a28" stroke="#ff5d6c" />
        <polygon points="8,44 20,50 8,56" fill="#ff5d6c" />
      </>
    )
  },
  grasshopper: {
    accent: '#5ce0c0',
    body: (
      <>
        <polygon points="18,50 76,42 90,50 76,58" fill="#0f332c" stroke="#5ce0c0" />
        <polygon points="40,42 30,22 56,40" fill="#123f36" stroke="#5ce0c0" />
        <polygon points="40,58 30,78 56,60" fill="#123f36" stroke="#5ce0c0" />
        <circle cx="64" cy="50" r="4" fill="#5ce0c0" />
        <circle cx="50" cy="50" r="3" fill="#5ce0c0" />
      </>
    )
  },
  centipede: {
    accent: '#6fb0ff',
    body: (
      <>
        <rect x="12" y="40" width="20" height="20" rx="5" fill="#122040" stroke="#6fb0ff" />
        <rect x="30" y="41" width="18" height="18" rx="4" fill="#0e1a36" stroke="#6fb0ff" />
        <rect x="46" y="41" width="18" height="18" rx="4" fill="#122040" stroke="#6fb0ff" />
        <rect x="62" y="42" width="16" height="16" rx="4" fill="#0e1a36" stroke="#6fb0ff" />
        <polygon points="90,50 78,43 78,57" fill="#6fb0ff" />
        <line x1="20" y1="40" x2="16" y2="30" stroke="#6fb0ff" strokeWidth="2" />
        <line x1="20" y1="60" x2="16" y2="70" stroke="#6fb0ff" strokeWidth="2" />
      </>
    )
  },
  termite: {
    accent: '#c0c8ff',
    body: (
      <>
        <rect x="16" y="36" width="60" height="28" rx="8" fill="#1a2045" stroke="#c0c8ff" />
        <polygon points="86,50 74,42 74,58" fill="#c0c8ff" />
        <rect x="24" y="42" width="8" height="16" fill="#0e1330" stroke="#c0c8ff" />
        <rect x="38" y="42" width="8" height="16" fill="#0e1330" stroke="#c0c8ff" />
        <rect x="52" y="42" width="8" height="16" fill="#0e1330" stroke="#c0c8ff" />
      </>
    )
  },
  wasp: {
    accent: '#ffe14a',
    body: (
      <>
        <polygon points="12,50 74,40 94,50 74,60" fill="#3a3410" stroke="#ffe14a" />
        <rect x="30" y="46" width="30" height="8" fill="#161303" stroke="#ffe14a" />
        <polygon points="36,40 26,22 58,38" fill="#4a4416" stroke="#ffe14a" />
        <polygon points="36,60 26,78 58,62" fill="#4a4416" stroke="#ffe14a" />
        <polygon points="6,46 18,50 6,54" fill="#ffe14a" />
      </>
    )
  },
  scorpion: {
    accent: '#ff4d5e',
    body: (
      <>
        <polygon points="14,50 70,42 88,50 70,58" fill="#3a1018" stroke="#ff4d5e" />
        <polygon points="26,44 6,34 22,46" fill="#ff4d5e" />
        <polygon points="26,56 6,66 22,54" fill="#ff4d5e" />
        <polygon points="70,42 84,26 80,40" fill="#4a1420" stroke="#ff4d5e" />
        <path d="M84,50 q14,-2 18,-14 q-2,10 -10,16" fill="none" stroke="#ff4d5e" strokeWidth="2" />
        <circle cx="98" cy="34" r="3" fill="#ff4d5e" />
        <circle cx="52" cy="50" r="4" fill="#ff4d5e" />
      </>
    )
  },
  widow: {
    accent: '#b06bff',
    body: (
      <>
        <polygon points="12,50 66,40 96,50 66,60" fill="#1e1038" stroke="#b06bff" />
        <polygon points="34,42 18,18 52,40" fill="#160b2e" stroke="#b06bff" />
        <polygon points="34,58 18,82 52,60" fill="#160b2e" stroke="#b06bff" />
        <polygon points="66,46 60,50 66,54 62,50" fill="#b06bff" />
        <circle cx="48" cy="50" r="5" fill="#b06bff" />
        <circle cx="48" cy="50" r="9" fill="none" stroke="#b06bff" strokeWidth="1" opacity="0.6" />
      </>
    )
  }
}

export function ShipArt({ type, size = 64, flip = false, accent }: Props): React.JSX.Element {
  const hull = HULLS[type] ?? HULLS.gnat
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: flip ? 'scaleX(-1)' : undefined, overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`glow-${type}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent ?? hull.accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent ?? hull.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#glow-${type})`} />
      <g strokeWidth={2} strokeLinejoin="round">
        {hull.body}
      </g>
    </svg>
  )
}
