import type { Classification } from './types'

export interface Meta {
  label: string
  color: string
  glyph: string
}

// Palette + glyphs echo chess.com's Game Review labels.
export const META: Record<Classification, Meta> = {
  brilliant: { label: 'Brilliant', color: '#26c2a3', glyph: '!!' },
  great: { label: 'Great', color: '#6a9ec9', glyph: '!' },
  best: { label: 'Best', color: '#81b64c', glyph: '★' },
  excellent: { label: 'Excellent', color: '#81b64c', glyph: '✔' },
  good: { label: 'Good', color: '#95b776', glyph: '✔' },
  book: { label: 'Book', color: '#a88865', glyph: '▦' },
  inaccuracy: { label: 'Inaccuracy', color: '#f7c331', glyph: '?!' },
  mistake: { label: 'Mistake', color: '#e58f2a', glyph: '?' },
  miss: { label: 'Miss', color: '#e2695a', glyph: '✕' },
  blunder: { label: 'Blunder', color: '#fa412d', glyph: '??' },
}

// Order used in the summary count table — matches chess.com (Book is 3rd).
export const SUMMARY_ORDER: Classification[] = [
  'brilliant',
  'great',
  'book',
  'best',
  'excellent',
  'good',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
]
