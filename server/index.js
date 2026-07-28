// Local dev PGN proxy. In production this same logic runs as a Vercel
// serverless function (api/pgn.js) — both share shared/fetchPgn.js.
import express from 'express'
import { fetchPgn } from '../shared/fetchPgn.js'

const app = express()
app.use(express.json({ limit: '2mb' }))

app.post('/api/pgn', async (req, res) => {
  try {
    const result = await fetchPgn((req.body || {}).url)
    res.json(result)
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message || 'Failed to fetch the game.' })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`[pgn-proxy] listening on http://localhost:${PORT}`))
