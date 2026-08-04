import type { Metadata } from 'next'
import { BoardEditor } from '../../../src/screens/BoardEditor'

export const metadata: Metadata = {
  title: 'Chess Board Editor — build a position and export FEN',
  description: 'Place pieces on a board to set up any chess position, then copy the FEN or PGN, or send it straight to the engine for analysis.',
  alternates: { canonical: '/tools/editor' },
  openGraph: { title: 'Chess Board Editor — build a position and export FEN', description: 'Place pieces on a board to set up any chess position, then copy the FEN or PGN, or send it straight to the engine for analysis.', url: '/tools/editor' },
}

export default function Page() {
  return <BoardEditor />
}
