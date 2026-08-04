import type { Metadata } from 'next'
import { NextMove } from '../../../src/screens/NextMove'

export const metadata: Metadata = {
  title: 'Chess Next Move Calculator',
  description: 'Paste any FEN and get the best move from Stockfish 18, with the evaluation and the line the engine expects to follow.',
  alternates: { canonical: '/tools/next-move' },
  openGraph: { title: 'Chess Next Move Calculator', description: 'Paste any FEN and get the best move from Stockfish 18, with the evaluation and the line the engine expects to follow.', url: '/tools/next-move' },
}

export default function Page() {
  return <NextMove />
}
