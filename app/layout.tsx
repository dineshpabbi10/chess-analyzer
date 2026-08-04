import type { Metadata, Viewport } from 'next'
import { AppShell } from '../src/components/AppShell'
import { ServiceWorker } from '../src/components/ServiceWorker'
import '../src/styles.css'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chess-analyzer-ruddy.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Fast Chess Analyzer — free Stockfish game review',
    // Per-page titles fill in the %s.
    template: '%s · Fast Chess Analyzer',
  },
  description:
    'Free chess game review powered by Stockfish 18. Import a chess.com or Lichess game and get move classifications, accuracy, and the mistakes that cost you the game — all in your browser.',
  applicationName: 'Fast Chess Analyzer',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Chess Analyzer', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Fast Chess Analyzer',
    url: SITE_URL,
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512 }],
  },
  twitter: { card: 'summary' },
}

export const viewport: Viewport = {
  themeColor: '#302e2b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        <ServiceWorker />
      </body>
    </html>
  )
}
