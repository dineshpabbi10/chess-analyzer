import type { Metadata } from 'next'
import { Openings } from '../../src/screens/Openings'

export const metadata: Metadata = {
  title: 'Chess Opening Trainer — learn lines move by move',
  description: 'Learn chess openings line by line. You play your side and the board answers with theory: Italian, Ruy Lopez, London, Sicilian, Caro-Kann and French.',
  alternates: { canonical: '/openings' },
  openGraph: { title: 'Chess Opening Trainer — learn lines move by move', description: 'Learn chess openings line by line. You play your side and the board answers with theory: Italian, Ruy Lopez, London, Sicilian, Caro-Kann and French.', url: '/openings' },
}

export default function Page() {
  return <Openings />
}
