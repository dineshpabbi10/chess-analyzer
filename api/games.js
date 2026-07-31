// Vercel serverless function: GET /api/games?platform=&username=&max=
// Mirrors the local dev proxy (server/index.js); both use shared/fetchPgn.js.
import { fetchRecentGames } from '../shared/fetchPgn.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    const { platform, username, max } = req.query || {}
    const games = await fetchRecentGames(platform, username, max)
    res.status(200).json({ games })
  } catch (e) {
    res.status(e?.status || 502).json({ error: e?.message || 'Failed to list games.' })
  }
}
