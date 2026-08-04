// Type surface for the shared JS module used by the API route handlers.
export declare class PgnError extends Error {
  status: number
  constructor(message: string, status?: number)
}

export interface RecentGame {
  id: string
  url: string
  white: string
  black: string
  whiteElo: number | null
  blackElo: number | null
  result: string
  timeClass: string
  date: string | null
  pgn: string
}

export declare function fetchPgn(url: unknown): Promise<{ pgn: string; source: string }>
export declare function fetchRecentGames(
  platform: unknown,
  username: unknown,
  max?: unknown,
): Promise<RecentGame[]>
