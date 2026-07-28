# ♟ Chess Analyzer

A self-hosted clone of **chess.com's Game Review**. Paste a chess.com or lichess
game link, and it fetches the game, runs **Stockfish 16 (NNUE)** in your browser,
and produces the same experience you get on chess.com:

- **Move classifications** — Brilliant, Great, Best, Excellent, Good, Book,
  Inaccuracy, Mistake, Miss, Blunder — with the familiar colored badges shown on
  the board and in the move list.
- **Accuracy score** per player, plus an estimated performance rating.
- **Evaluation bar** and **best-move arrows** so you can see exactly where a game
  turned and what you should have played instead.
- A **Game Review panel** summarizing every move type for both sides.
- Full move-by-move navigation (click a move, use the arrow buttons, or the
  keyboard `←` `→` `Home` `End`, and `f` to flip the board).

Everything runs locally — the engine is WebAssembly in your browser, and a tiny
Node proxy only fetches the game PGN (to get around browser CORS).

## Requirements

- Node.js 18+ (tested on 18.16)

## Run

```bash
npm install
npm run dev
```

Then open **http://localhost:5173**.

`npm run dev` starts two things:

- the **PGN proxy** on `http://localhost:3001` (`server/index.js`)
- the **Vite** dev server on `http://localhost:5173` (Vite proxies `/api` → 3001)

## Deploy (Vercel — free)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/chess-analyzer)

> Replace `YOUR_USERNAME/chess-analyzer` in the button link above with your own
> public repo once you've pushed it to GitHub — Vercel's Deploy button clones a
> git repository into the user's account, so it needs a real URL to point at.

The engine runs in the browser, so there's no analysis backend to host — only the
tiny PGN proxy, which runs as a serverless function. It deploys to Vercel's free
Hobby tier at $0.

- `vercel.json` — build config (`vite build` → `dist`) + long-cache headers for the
  engine/piece assets.
- `api/pgn.js` — the PGN proxy as a Vercel serverless function (`POST /api/pgn`).
- `server/index.js` — the same logic for local dev; both share `shared/fetchPgn.js`.

**Option A — CLI (no git needed):**

```bash
npm i -g vercel
vercel        # first run: link/create project, accept the detected settings
vercel --prod # promote to production
```

**Option B — GitHub:** push this folder to a repo, then "Add New Project" at
vercel.com and import it. Vercel auto-detects Vite and the `api/` function — no
extra settings.

Notes:
- The 40 MB NNUE weights file (`public/engine/nn-*.nnue`) must be committed/uploaded
  — it's how the engine evaluates. It's cached `immutable`, so each visitor
  downloads it only once.
- Hobby tier includes 100 GB/month bandwidth (~2,400 first-time analyses). Plenty
  for personal use; repeat visits are served from cache.

## Using it

Paste any of these into the box and press **Analyze**:

- `https://www.chess.com/game/live/2280058564`
- `https://lichess.org/q7ZvsdUF`
- a raw **PGN** (pasted directly — no network needed)

Pick an engine depth first: **Fast** (12), **Balanced** (15), or **Deep** (18).
Deeper = more accurate classifications but slower (analysis is one Stockfish pass
per position, single-threaded WASM).

## How move classification works

For each position the engine reports its best line (and 2nd-best, via MultiPV=2).
Evals are converted to a **win probability** using the same logistic model
chess.com/lichess use, and each move is scored by how much win probability it
gave up:

| Loss in win% | Label |
|---|---|
| move is engine's top choice, ~0 loss | **Best** |
| < 2% | **Excellent** |
| < 5% | **Good** |
| < 10% | **Inaccuracy** |
| < 20% | **Mistake** |
| ≥ 20% | **Blunder** |

On top of that:

- **Brilliant** — a top move that sacrifices material yet keeps the position sound.
- **Great** — the only move that holds the advantage (the alternatives are far worse).
- **Miss** — you had a clearly winning chance (or mate) and let most of it slip.
- **Book** — an early theory move.

Per-move accuracy uses chess.com's formula
`103.1668·e^(−0.04354·winLoss) − 3.1669`, and a player's accuracy is the average
across their moves.

## Project layout

```
server/index.js            PGN proxy (chess.com callback+archive, lichess export)
public/engine/             Stockfish 16 single-threaded WASM + NNUE weights
public/pieces/             cburnett SVG piece set
src/lib/engine.ts          Stockfish Web Worker wrapper (UCI, MultiPV)
src/lib/analysis.ts        Runs the engine over every position, builds the report
src/lib/classify.ts        Win%, accuracy, and the classification rules
src/components/            Board, EvalBar, MoveList, ReviewSummary, MoveDetails
src/App.tsx                Input screen + review screen
```

## Notes & limitations

- The estimated performance rating is a rough heuristic from average accuracy — it
  is not chess.com's proprietary formula.
- Brilliant / Great / Miss detection is heuristic and won't always match chess.com
  move-for-move, but it uses the same underlying ideas (sacrifices, only-moves,
  missed wins).
- chess.com links are resolved via the public callback + `api.chess.com` monthly
  archives. Very old or hidden games may not be retrievable — in that case, open
  the game on chess.com, copy its PGN, and paste it directly.

## Credits

- [Stockfish](https://stockfishchess.org/) (GPLv3) via
  [stockfish.js](https://github.com/nmrugg/stockfish.js)
- [chess.js](https://github.com/jhlywa/chess.js) for move generation
- cburnett chess pieces (Wikimedia Commons)
