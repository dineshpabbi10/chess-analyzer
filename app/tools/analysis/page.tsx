import type { Metadata } from 'next'
import { AnalysisBoard } from '../../../src/screens/AnalysisBoard'

export const metadata: Metadata = {
  title: 'Chess Analysis Board — free Stockfish engine',
  description: 'Free online chess analysis board with live Stockfish 18 evaluation. Play moves, branch into variations, and load any FEN or PGN. Runs entirely in your browser.',
  alternates: { canonical: '/tools/analysis' },
  openGraph: { title: 'Chess Analysis Board — free Stockfish engine', description: 'Free online chess analysis board with live Stockfish 18 evaluation. Play moves, branch into variations, and load any FEN or PGN. Runs entirely in your browser.', url: '/tools/analysis' },
}

export default function Page() {
  return <AnalysisBoard />
}
