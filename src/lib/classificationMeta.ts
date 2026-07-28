import type { Classification } from './types'

export interface Meta {
  label: string
  color: string
  glyph: string
}

// Palette + glyphs echo chess.com's Game Review labels.
export const META: Record<Classification, Meta> = {
  brilliant: { label: 'Brilliant', color: '#1baca6', glyph: '!!' },
  great: { label: 'Great', color: '#5c8bb0', glyph: '!' },
  best: { label: 'Best', color: '#81b64c', glyph: '★' },
  excellent: { label: 'Excellent', color: '#81b64c', glyph: '✔' },
  good: { label: 'Good', color: '#95b776', glyph: '✔' },
  book: { label: 'Book', color: '#a88865', glyph: '▦' },
  inaccuracy: { label: 'Inaccuracy', color: '#f0c15c', glyph: '?!' },
  mistake: { label: 'Mistake', color: '#e58f2a', glyph: '?' },
  miss: { label: 'Miss', color: '#ee6b55', glyph: '⤬' },
  blunder: { label: 'Blunder', color: '#ca3431', glyph: '??' },
}

// Order used in the summary count table (best -> worst).
export const SUMMARY_ORDER: Classification[] = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
]
