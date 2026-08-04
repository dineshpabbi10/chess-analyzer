// Small inline stroke-icon set for the app navigation. Inline SVG keeps it
// dependency-free and lets icons inherit currentColor.

type Props = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

/** Game Review — a bar chart with a rising trend. */
export const IconReview = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-4M12 16V9M16 16v-6" />
  </svg>
)

/** Coach — a person with a highlight. */
export const IconCoach = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
)

/** Puzzles — a puzzle piece. */
export const IconPuzzle = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M10 4.5a1.8 1.8 0 0 1 3.6 0V6h2.6a1 1 0 0 1 1 1v2.6h1.3a1.8 1.8 0 0 1 0 3.6H17V17a1 1 0 0 1-1 1h-2.6v-1.4a1.8 1.8 0 0 0-3.6 0V18H7a1 1 0 0 1-1-1v-2.6H4.7a1.8 1.8 0 0 1 0-3.6H6V7a1 1 0 0 1 1-1h3V4.5Z" />
  </svg>
)

/** Openings — an open book. */
export const IconBook = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M12 6.5v13" />
    <path d="M12 6.5C10.5 5 8.4 4.5 4.5 5v12.5c3.9-.5 6 0 7.5 1.5" />
    <path d="M12 6.5C13.5 5 15.6 4.5 19.5 5v12.5c-3.9-.5-6 0-7.5 1.5" />
  </svg>
)

/** Analysis Board — a chequered grid. */
export const IconBoard = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 4v16M4 12h16" />
    <path d="M4 8h4M16 8h4M8 16h4M16 16h4" strokeWidth="1.2" opacity="0.55" />
  </svg>
)

/** Next Move — a lightbulb (the "what should I play" tool). */
export const IconBulb = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M9 17h6" />
    <path d="M10 20h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.5.6.5 1V17h6v-2.1c0-.4.1-.7.5-1A6 6 0 0 0 12 3Z" />
  </svg>
)

/** Board Editor — a pencil. */
export const IconPencil = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4 16.5V20Z" />
    <path d="M13.5 7 17 10.5" />
  </svg>
)

/** Elo Calculator — a calculator. */
export const IconCalc = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8.5 7.5h7" />
    <path d="M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" strokeWidth="2.4" />
  </svg>
)

/** More — a 2x2 grid of dots. */
export const IconMore = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01" strokeWidth="2.6" />
  </svg>
)

/** Pawn — used for the brand mark. */
export const IconPawn = ({ size = 22 }: Props) => (
  <svg {...base(size)}>
    <circle cx="12" cy="7" r="2.6" />
    <path d="M9.6 9.6c0 1.8-1.1 2.6-1.6 4.2-.3 1 0 1.7.6 2.2h6.8c.6-.5.9-1.2.6-2.2-.5-1.6-1.6-2.4-1.6-4.2" />
    <path d="M6.5 20h11" />
  </svg>
)

/* ---- playback / navigation controls ---- */

/** Jump to start. */
export const IconFirst = ({ size = 20 }: Props) => (
  <svg {...base(size)}>
    <path d="M18.5 6v12L10 12l8.5-6Z" fill="currentColor" stroke="none" />
    <path d="M6 5.5v13" strokeWidth="2.2" />
  </svg>
)

/** Step back one move. */
export const IconPrev = ({ size = 20 }: Props) => (
  <svg {...base(size)}>
    <path d="M16 5.5v13L6.5 12 16 5.5Z" fill="currentColor" stroke="none" />
  </svg>
)

/** Step forward one move. */
export const IconNext = ({ size = 20 }: Props) => (
  <svg {...base(size)}>
    <path d="M8 5.5v13L17.5 12 8 5.5Z" fill="currentColor" stroke="none" />
  </svg>
)

/** Jump to end. */
export const IconLast = ({ size = 20 }: Props) => (
  <svg {...base(size)}>
    <path d="M5.5 6v12L14 12 5.5 6Z" fill="currentColor" stroke="none" />
    <path d="M18 5.5v13" strokeWidth="2.2" />
  </svg>
)

/** Flip the board. */
export const IconFlip = ({ size = 20 }: Props) => (
  <svg {...base(size)}>
    <path d="M8 4.5 5 7.5h6L8 4.5Z" fill="currentColor" stroke="none" />
    <path d="M8 7.5v9" />
    <path d="M16 19.5l3-3h-6l3 3Z" fill="currentColor" stroke="none" />
    <path d="M16 16.5v-9" />
  </svg>
)

/** Tick — used for solved/learned states. */
export const IconCheck = ({ size = 18 }: Props) => (
  <svg {...base(size)}>
    <path d="M5 12.5l4.5 4.5L19 7" strokeWidth="2.4" />
  </svg>
)

/** Cross — used for wrong answers. */
export const IconCross = ({ size = 18 }: Props) => (
  <svg {...base(size)}>
    <path d="M7 7l10 10M17 7L7 17" strokeWidth="2.4" />
  </svg>
)
