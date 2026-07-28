/* Service worker for Fast Chess Analyzer.
 *
 * On install it precaches the full app shell (index.html + its hashed JS/CSS,
 * discovered by parsing the HTML) plus the engine js/wasm and piece art, so the
 * app opens AND analyzes fully offline. The 40 MB NNUE net is intentionally not
 * cached — the engine doesn't load it.
 *
 * Runtime strategy:
 *  - Navigations: network-first, fall back to cached "/" (which keeps its
 *    COOP/COEP headers, so the offline page stays cross-origin isolated and the
 *    multi-threaded engine still works).
 *  - /engine/* and /pieces/*: cache-first.
 *  - Other same-origin assets: stale-while-revalidate.
 *  - /api/*: never cached (fetching a game needs the network).
 */
const VERSION = 'v2'
const APP_CACHE = `fca-app-${VERSION}`
const ENGINE_CACHE = `fca-engine-${VERSION}`

const SHELL_EXTRAS = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']
const ENGINE_FILES = [
  '/engine/stockfish-nnue-16.js',
  '/engine/stockfish-nnue-16.wasm',
  '/engine/stockfish-nnue-16-single.js',
  '/engine/stockfish-nnue-16-single.wasm',
]
const PIECES = ['K', 'Q', 'R', 'B', 'N', 'P'].flatMap((p) => [`/pieces/w${p}.svg`, `/pieces/b${p}.svg`])

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const appCache = await caches.open(APP_CACHE)

      // 1) Fetch the shell, cache it (with its COOP/COEP headers), and parse out
      //    the hashed asset URLs it references so they're cached too.
      const res = await fetch('/', { cache: 'no-cache' })
      await appCache.put('/', res.clone())
      const html = await res.text()
      const assets = new Set()
      const re = /(?:src|href)="(\/assets\/[^"]+)"/g
      let m
      while ((m = re.exec(html))) assets.add(m[1])
      await appCache.addAll([...assets, ...SHELL_EXTRAS])

      // 2) Engine + pieces (best-effort so one failure can't break install).
      const engineCache = await caches.open(ENGINE_CACHE)
      await Promise.allSettled(
        [...ENGINE_FILES, ...PIECES].map(async (url) => {
          const r = await fetch(url, { cache: 'no-cache' })
          if (r.ok) await engineCache.put(url, r)
        }),
      )

      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== APP_CACHE && k !== ENGINE_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

const isEngineAsset = (url) =>
  url.pathname.startsWith('/engine/') || url.pathname.startsWith('/pieces/')

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // let cross-origin requests pass through
  if (url.pathname.startsWith('/api/')) return // never intercept the PGN proxy

  // App shell — network-first so we pick up new deploys, cache "/" for offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(APP_CACHE).then((cache) => cache.put('/', copy))
          return res
        })
        .catch(() => caches.match('/', { ignoreSearch: true })),
    )
    return
  }

  // Engine weights / wasm / piece art — cache-first, kept for offline use.
  if (isEngineAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(ENGINE_CACHE).then((cache) => cache.put(request, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  // Everything else same-origin (hashed JS/CSS, etc.) — stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(APP_CACHE).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
