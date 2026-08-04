import type { Metadata } from 'next'
import { Puzzles } from '../../src/screens/Puzzles'

export const metadata: Metadata = {
  title: 'Free Chess Puzzles — unlimited and Elo-rated',
  description: 'Unlimited rated chess tactics puzzles with no account required. Your puzzle rating adapts to your level, plus a new daily puzzle and streak tracking.',
  alternates: { canonical: '/puzzles' },
  openGraph: { title: 'Free Chess Puzzles — unlimited and Elo-rated', description: 'Unlimited rated chess tactics puzzles with no account required. Your puzzle rating adapts to your level, plus a new daily puzzle and streak tracking.', url: '/puzzles' },
}

export default function Page() {
  return <Puzzles />
}
