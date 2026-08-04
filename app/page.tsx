import type { Metadata } from 'next'
import { App } from '../src/App'

export const metadata: Metadata = {
  // Uses the layout's default title (no "· Fast Chess Analyzer" suffix on home).
  title: {
    absolute: 'Fast Chess Analyzer — free Stockfish game review',
  },
  description:
    'Free chess game review powered by Stockfish 18. Import a chess.com or Lichess game and get move classifications, accuracy, and the mistakes that cost you the game.',
  alternates: { canonical: '/' },
}

export default function Page() {
  return <App />
}
