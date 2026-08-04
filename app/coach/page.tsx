import type { Metadata } from 'next'
import { Coach } from '../../src/screens/Coach'

export const metadata: Metadata = {
  title: 'Chess Coach — find your weaknesses',
  description: 'Analyze a batch of your recent chess.com or Lichess games at once. See which phase of the game leaks points, when you blunder, and which openings hurt your results.',
  alternates: { canonical: '/coach' },
  openGraph: { title: 'Chess Coach — find your weaknesses', description: 'Analyze a batch of your recent chess.com or Lichess games at once. See which phase of the game leaks points, when you blunder, and which openings hurt your results.', url: '/coach' },
}

export default function Page() {
  return <Coach />
}
