// Vercel serverless function: POST /api/pgn { url } -> { pgn, source }.
// Mirrors the local dev proxy (server/index.js); both use shared/fetchPgn.js.
import { fetchPgn } from '../shared/fetchPgn.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    // Vercel usually parses JSON bodies for us; fall back to manual parse.
    let body = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        body = {}
      }
    }
    const result = await fetchPgn((body || {}).url)
    res.status(200).json(result)
  } catch (e) {
    res.status(e?.status || 502).json({ error: e?.message || 'Failed to fetch the game.' })
  }
}
