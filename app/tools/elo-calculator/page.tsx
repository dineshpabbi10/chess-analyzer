import type { Metadata } from 'next'
import { EloCalculator } from '../../../src/screens/EloCalculator'

export const metadata: Metadata = {
  title: 'Chess Elo Calculator — rating change',
  description: 'Work out how a win, draw or loss will change your chess rating. Enter both ratings and a K-factor to see the expected score and every outcome.',
  alternates: { canonical: '/tools/elo-calculator' },
  openGraph: { title: 'Chess Elo Calculator — rating change', description: 'Work out how a win, draw or loss will change your chess rating. Enter both ratings and a K-factor to see the expected score and every outcome.', url: '/tools/elo-calculator' },
}

export default function Page() {
  return <EloCalculator />
}
