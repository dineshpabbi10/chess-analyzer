import { META } from '../lib/classificationMeta'
import type { Classification } from '../lib/types'

// chess.com-style badge: a colored circle with a white icon. Text glyphs for the
// "!"/"?" families, drawn shapes for Best/Excellent/Good/Book/Miss.
type Shape = 'star' | 'thumb' | 'check' | 'book' | 'cross'
const SHAPE: Partial<Record<Classification, Shape>> = {
  best: 'star',
  excellent: 'thumb',
  good: 'check',
  book: 'book',
  miss: 'cross',
}
const TEXT: Partial<Record<Classification, string>> = {
  brilliant: '!!',
  great: '!',
  inaccuracy: '?!',
  mistake: '?',
  blunder: '??',
}

function ShapeIcon({ shape }: { shape: Shape }) {
  const white = '#fff'
  switch (shape) {
    case 'star':
      return (
        <path
          fill={white}
          transform="translate(12 12) scale(0.62) translate(-12 -12)"
          d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z"
        />
      )
    case 'thumb':
      return (
        <path
          fill={white}
          transform="translate(12 12) scale(0.6) translate(-12 -12)"
          d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
        />
      )
    case 'check':
      return (
        <path
          fill="none"
          stroke={white}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12.5l3.8 3.8L18 7.5"
        />
      )
    case 'cross':
      return (
        <path
          fill="none"
          stroke={white}
          strokeWidth="2.6"
          strokeLinecap="round"
          d="M7.5 7.5l9 9M16.5 7.5l-9 9"
        />
      )
    case 'book':
      return (
        <path
          fill={white}
          transform="translate(12 12) scale(0.62) translate(-12 -12)"
          d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.65 1 5.5v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.35 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V5.5c-.6-.45-1.25-.75-2-.5zM12 18.5c-1.45-.9-3.55-1.5-5.5-1.5-1.35 0-2.7.15-4 .5V6.5c1.3-.35 2.65-.5 4-.5 1.95 0 4.05.4 5.5 1.5v11z"
        />
      )
  }
}

export function ClassIcon({ type, size = 26 }: { type: Classification; size?: number }) {
  const m = META[type]
  const shape = SHAPE[type]
  const text = TEXT[type]
  return (
    <svg
      className="cls-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={m.label}
    >
      <circle cx="12" cy="12" r="12" fill={m.color} />
      {shape ? (
        <ShapeIcon shape={shape} />
      ) : (
        <text
          x="12"
          y="12.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontWeight="800"
          fontSize={text && text.length > 1 ? 10 : 14}
          letterSpacing={text === '!!' ? '-1' : '0'}
          fill="#fff"
        >
          {text}
        </text>
      )}
    </svg>
  )
}
