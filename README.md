# ♟ Fast Chess Analyzer

A self-hosted, **installable** clone of **chess.com's Game Review**. Paste a
chess.com or lichess game link, and it fetches the game, runs **Stockfish 18
(Lite)** in your browser, and produces the same experience you get on chess.com:

- **Move classifications** — Brilliant, Great, Best, Excellent, Good, Book,
  Inaccuracy, Mistake, Miss, Blunder — with the familiar colored badges shown on
  the board and in the move list.
- **Accuracy score** per player, plus an estimated performance rating.
- **Evaluation bar** and **best-move arrows** so you can see exactly where a game
  turned and what you should have played instead.
- A **Game Review panel** summarizing every move type for both sides.
- Full move-by-move navigation (click a move, use the arrow buttons, or the
  keyboard `←` `→` `Home` `End`, and `f` to flip the board).

Everything analysis-related runs locally — the engine is WebAssembly in your
browser. The server only fetches game PGNs (to get around browser CORS) and
renders pages/blog posts.

## Install it (PWA)

Fast Chess Analyzer is a **Progressive Web App**, so you can install it like a
native app:

- **Desktop (Chrome/Edge):** click the install icon in the address bar, or
  menu → "Install Fast Chess Analyzer".
- **iOS Safari:** Share → "Add to Home Screen".
- **Android Chrome:** menu → "Install app" / "Add to Home Screen".

Once installed it opens in its own window (no browser chrome) from the home
screen / dock. A service worker precaches the app shell, the Stockfish engine,
and the piece art, so **the app opens and analyzes pasted PGNs offline** — only
fetching a game *by link* needs a connection. The install requires HTTPS (or
`localhost`), which the Vercel deploy provides automatically.

PWA pieces live in `public/manifest.webmanifest`, `public/sw.js`, and
`public/icons/`; the service worker is registered by
`src/components/ServiceWorker.tsx` (production builds only).

## Requirements

- **Node.js 20** (Next.js 15 requires >= 18.18). An `.nvmrc` is included:

```bash
nvm use
```

## Run

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**. The API routes (`/api/pgn`, `/api/games`) run
in the same Next.js server — there is no separate proxy process any more.

## Writing blog posts

Posts are Markdown in `content/blog/`. Write them in the browser at **`/admin`**
(Decap CMS, commits to GitHub) or add files by hand. See
[docs/cms-setup.md](docs/cms-setup.md) for the one-time GitHub OAuth setup.

## Deploy (Vercel — free)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/chess-analyzer)

> Replace `YOUR_USERNAME/chess-analyzer` in the button link above with your own
> public repo once you've pushed it to GitHub — Vercel's Deploy button clones a
> git repository into the user's account, so it needs a real URL to point at.

The engine runs in the browser, so there's no analysis backend to host. It deploys
to Vercel's free Hobby tier at $0.

Vercel auto-detects Next.js, so there is no `vercel.json` to maintain. Caching
headers for the engine and the service worker live in `next.config.mjs`, and
`app/api/*` are the route handlers (they share `shared/fetchPgn.js`).

To enable the CMS you must also set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
— see [docs/cms-setup.md](docs/cms-setup.md).

**Option A — CLI (no git needed):**

```bash
npm i -g vercel
vercel        # first run: link/create project, accept the detected settings
vercel --prod # promote to production
```

**Option B — GitHub:** push this folder to a repo, then "Add New Project" at
vercel.com and import it. Vercel auto-detects Next.js — no extra settings.

Notes:
- The engine is ~7 MB (`public/engine/stockfish-18-lite-single.*`) and must be
  committed/uploaded. Its NNUE net is **embedded**, so there is no separate
  weights file. It's cached `immutable`, so each visitor downloads it once.
- Hobby tier includes 100 GB/month bandwidth. At ~7 MB per first-time visitor
  that's plenty for personal use; repeat visits are served from cache.

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
app/                       Next.js App Router: one folder per route
app/api/                   route handlers (pgn, games, CMS OAuth)
app/blog/                  blog index + [slug], statically generated
content/blog/              the posts themselves (Markdown + frontmatter)
public/admin/              Decap CMS (config.yml + entry page)
shared/fetchPgn.js         chess.com / lichess fetching, used by the API routes
public/engine/             Stockfish 18 Lite, single-threaded WASM (net embedded)
public/pieces/             cburnett SVG piece set
src/lib/engine.ts          Stockfish Web Worker wrapper (UCI, MultiPV)
src/lib/analysis.ts        Runs the engine over every position, builds the report
src/lib/classify.ts        Win%, accuracy, and the classification rules
src/components/            Board, EvalBar, MoveList, ReviewSummary, MoveDetails
src/screens/               one component per page (named to avoid Next's pages/)
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
