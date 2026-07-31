# Chessigma Feature Analysis & Implementation Plan

A competitive teardown of **chessigma.com** and a phased plan to build its core
features into our app (**Fast Chess Analyzer**). Feature ideas are described
functionally; nothing here copies their content.

---

## 1. What Chessigma is

A free, no-signup chess improvement platform. Its pitch is "unlimited game
review + puzzles + AI coaching, all the stuff Chess.com puts behind Diamond, for
free." Everything analysis-related runs client-side via Stockfish 17 (WASM).

**Their surface area (from the site map):**

| Area | Routes | What it does |
|---|---|---|
| Game Review | `/` | Import by username (chess.com/lichess) or PGN → full analyzed report |
| Analysis Board | `/tools/analysis` | Free engine board, move tree w/ variations, FEN-in-URL |
| Board Editor | `/tools/analysis/editor` | Drag-drop piece placement → export FEN/PGN |
| Next Move | `/tools/next-move` | Best move from any FEN |
| Elo Calculator | `/tools/elo-calculator` | Rating-change estimate from a result |
| Puzzles | `/puzzles`, `/daily` | Elo-rated adaptive puzzles (Lichess DB), daily puzzle |
| Opening Trainer | `/openings` | Learn opening lines move-by-move, progress tracking |
| AI Coach ("Supercoach") | `/supercoach` | Reads last ~25 games → personalized training plan + metrics |
| Blunder Training | (in puzzles) | Puzzles generated from *your* blunders |
| Accounts | `/signin` | Save usernames, track players, ratings, streaks |
| Social/gamification | `/leaderboard`, `/wrapped`, day-streak | Leaderboards, "year in review", streaks |
| Content | `/blog`, FAQ | SEO articles |

---

## 2. Where we already are

We've effectively already built the hardest, most valuable piece — the **Game
Review** — plus a lot of the **Analysis Board**:

- ✅ Import a single game by **chess.com / lichess link** or pasted PGN (Express proxy).
- ✅ Full **Stockfish (16) analysis** in-browser, streaming move-by-move.
- ✅ **Move classification** (Brilliant → Blunder + Book/Great/Miss), accuracy,
  per-move centipawn loss, best-move suggestion, opening name.
- ✅ **Eval graph** with classification dots (chess.com-style Game Review).
- ✅ Board with badges, arrows, move list, full navigation, PWA/offline.

**So the gap to Chessigma is mostly breadth, not depth**: more tools around the
engine, plus persistence (accounts/DB) for the social/tracking features.

---

## 3. Gap analysis

| Chessigma feature | Us today | Gap size |
|---|---|---|
| Single game review + report | ✅ Have (strong) | — |
| Analysis board (free play, eval) | 🟡 Partial (no free-play move tree/variations, no board-editor) | Medium |
| **Import recent games by username** | ❌ (link/PGN only) | Small–Medium |
| Board editor (FEN/PGN export) | ❌ | Small |
| Next-move calculator | ❌ (trivial given engine) | Small |
| Elo calculator | ❌ (pure math) | Tiny |
| **Puzzles (Elo-rated, adaptive)** | ❌ | Large (data + persistence) |
| Daily puzzle + streaks | ❌ | Medium (needs persistence) |
| **Opening trainer** | ❌ | Large (line data + trainer UI) |
| **AI coach / multi-game report** | ❌ | Large (aggregate analytics + LLM) |
| Blunder training (from your games) | ❌ | Medium (builds on review) |
| Accounts / persistence | ❌ (fully static) | Large (architectural) |
| Leaderboards / Wrapped | ❌ | Medium (needs accounts) |

**Two architectural prerequisites** unlock most of the missing breadth:

1. **Username-based multi-game import** — extend the proxy to list a player's
   recent games (both platforms already expose this) and let the user pick one.
   Enables the coach, blunder training, and "review your whole history."
2. **Accounts + a database** — needed for puzzle ratings, streaks, saved
   usernames, leaderboards, training progress. This is the single biggest
   architectural decision (see §6).

---

## 4. Engine reality check (important)

We just **reverted to single-threaded Stockfish** for reliability (the
multi-threaded build's fixed 512 MB SharedArrayBuffer crashed on real devices).
Implications for this plan:

- **Puzzles / Next-move / Opening trainer** need only a *single quick search*
  (depth ~12–18, <1 s). Single-threaded is totally fine.
- **Full game review / coach** is the heavy path (N positions). Single-threaded
  is ~5× slower than multithreaded. Streaming keeps it usable, but a "read your
  last 25 games" coach at browser speed is impractical client-side.
- **Options to consider** (revisit later, not now): upgrade to **Stockfish 17**
  (chessigma uses it); offer a smaller/cheaper depth for bulk; or the previously-
  discussed optional analysis server for the multi-game coach.

---

## 5. Phased implementation plan

Ordered by **value ÷ effort**, front-loading things that reuse our engine and
need **no backend**.

### Phase 1 — Engine tools (no backend) — **COMPLETE ✅**

These are small, high-polish wins that reuse the existing `Engine` wrapper.

> **Status:** all four shipped — **Analysis Board** (free play, click-to-move with
> legal-move dots, variation tree, live eval + PV, FEN/PGN load, `?fen=` in the
> URL), **Board Editor**, **Next Move**, **Elo Calculator** — plus the supporting
> infrastructure: a tiny History-API **router** (`src/lib/router.tsx`), a shared
> lazy **engine singleton** (`src/lib/engineSingleton.ts`), a responsive **nav /
> PageShell**, `Board` extended with an interactive mode, `Engine.stop()` for
> responsive re-analysis, and Vercel SPA rewrites for deep links.

1. **Board Editor** (`/tools/editor`)
   - Drag-drop pieces onto/off the board + palette; side-to-move, castling,
     en-passant toggles. Output live **FEN** and **PGN** (from start).
   - Reuse `Board` rendering; add an editable mode + a piece palette.
   - *Effort: S.*

2. **Analysis Board with free play + variations** (`/tools/analysis`)
   - Let the user make moves from any position, branch into side lines, and see
     Stockfish eval / PV / depth live. Persist current position to `?fen=` in URL.
   - Extends our board: add a **move tree** model (main line + variations),
     click-to-navigate, and a live engine readout (we already stream evals).
   - *Effort: M.* (Move-tree data structure is the real work.)

3. **Next-Move Calculator** (`/tools/next-move`)
   - Input a FEN (or set up on a board) → engine's best move + eval + short PV.
   - Thin wrapper over `engine.analyze(fen)`.
   - *Effort: S.*

4. **Elo Calculator** (`/tools/elo-calculator`)
   - Pure math (expected score + K-factor). Inputs: your rating, opponent
     rating, result → rating delta. No engine.
   - *Effort: XS.*

**Deliverable:** a real "Tools" section, matching 4 of chessigma's utilities,
with zero backend.

### Phase 2 — Broader import + multi-game (no backend, days)

5. **Import recent games by username** — **DONE ✅**
   - `GET /api/games?platform=&username=&max=` (in `shared/fetchPgn.js`, exposed by
     both `server/index.js` and `api/games.js`): chess.com monthly archives /
     lichess ndjson → a normalized list with the PGN inlined (so picking a game
     analyzes with no second round-trip).
   - Frontend `GamePicker`: platform toggle, username box, list with W/D/L badges,
     ratings, time class and date; clicking a row runs the existing review.
   - **Note:** lichess allows only ~1 concurrent request per IP and rate-limits
     hard (HTTP 429) — handled with a friendly message.
   - *Effort: M.*

6. **Blunder review (single game → drill positions)** — **DONE ✅**
   - "Drill mistakes (N)" on the review screen opens an overlay that replays the
     position before each Mistake/Blunder/Miss and asks for a better move.
   - Grading is *tolerant*: the played move is analyzed and compared to the best
     available — within 0.50 counts as solved, within 1.50 as "better but not
     best", worse than that as wrong. (Demanding the exact engine move would be
     needlessly harsh since positions often have several good moves.)
   - Side filter (both / each player by name), prev/next, score, reveal-answer,
     and the best move shown as an arrow once answered.
   - *Effort: S–M* (reuses analysis output).

### Phase 3 — Puzzles (no data hosting needed — use the Lichess puzzle API)

> **Revised after live testing.** We do **not** need to bundle or host the puzzle
> database. Lichess serves puzzles from a public API with **no auth** and
> `Access-Control-Allow-Origin: *`, so the **browser fetches them directly** —
> each user hits Lichess from their own IP, so there's no shared rate-limit
> bottleneck, no storage, and no cost for us.
>
> Verified endpoints (all 200, no token):
> - `GET /api/puzzle/next` — supports `difficulty=easiest|easier|normal|harder|hardest`
>   and `angle=<theme>` (e.g. `mateIn2`). Repeat calls return different puzzles.
> - `GET /api/puzzle/daily` — same puzzle for everyone → daily puzzle + streaks.
> - Response: `puzzle.{id, fen, solution[] (UCI), rating, themes, initialPly,
>   lastMove}` + `game.{pgn, players, …}`.
>
> **Use `puzzle.fen` directly** — verified that the solution replays legally from
> it (e.g. `Rxf1+ Qxf1 Qg1+ Qxg1 Rxg1#`, ending in mate, matching its `mateIn3`
> theme). No PGN replay needed.
>
> Because `puzzle.rating` comes back with every puzzle, our **Elo math is exact**
> even unauthenticated: we track the user's rating locally and score it against
> the puzzle's own rating. (Unauthenticated `difficulty` is relative to a default,
> not the user, so we map our tracked rating → difficulty bucket ourselves.)
>
> Trade-off: puzzles need network, unlike the rest of the app which works offline.
> Mitigation: prefetch/cache a few puzzles for offline play.
> chess.com's `/pub/puzzle/random` exists too but has no rating or solution array,
> so it isn't suitable for rated training.

7. **Tactics puzzles** (`/puzzles`)
   - **UX:** show the position → user plays the solution moves (validate against
     `solution`, opponent replies played automatically) → next puzzle chosen by
     the user's tracked rating; engine available for a hint.
   - **Adaptive rating:** standard Elo against `puzzle.rating`, stored in
     localStorage (upgrade to accounts in Phase 5 for cross-device sync).
   - *Effort: M* (solver UX + rating logic; no data plumbing).

8. **Daily puzzle + streak** (`/daily`)
   - `/api/puzzle/daily` + a localStorage streak counter.
   - *Effort: S* (on top of #7).

### Phase 4 — Opening Trainer — **DONE ✅**

9. **Opening Trainer** (`/openings`)
   - **Data:** hand-curated line lists in `src/lib/openings.ts` — 6 openings
     (Italian, Ruy Lopez, London, Sicilian, Caro-Kann, French), 14 lines. Kept
     **static on purpose** so the trainer works offline and the lines are *taught*
     rather than being "whatever move is most popular".
   - Every line was validated against chess.js: all legal, and all SAN matches
     chess.js's canonical output exactly (so check/capture annotations are right).
   - **UX:** learner plays their side, book replies auto-play after a short beat;
     wrong move → retry, second wrong → the move is revealed; completing a line
     marks it learned and shows the idea behind it. Side filter, per-opening
     "N/M learned", line picker with ✔ marks. Progress in localStorage.
   - When the learner is Black, White's first move is pre-played automatically.

### Phase 5 — Accounts, persistence & social (architectural)

This is the big lift and gates the "sticky" features. **Decision required** (§6).

10. **Accounts + database**
    - Auth (email magic-link or OAuth). Store: saved usernames, puzzle rating +
      history, streaks, opening-trainer progress, saved games.
    - *Effort: L.*

11. **Leaderboards** (`/leaderboard`, `/leaderboard/puzzle`) — needs accounts.
12. **"Wrapped" / year-in-review** — aggregate a player's year of games into a
    shareable summary. *Effort: M* on top of import + analysis.

### Phase 6 — AI Coach (the flagship differentiator)

13. **Multi-game coach report** (`/coach`)
    - Analyze a player's last ~25 games (bulk review), then compute **aggregate
      metrics**: accuracy/ACPL trend, blunder rate by phase & time-pressure,
      opening performance, conversion (winning positions held), recurring mistake
      patterns.
    - Present as a **dashboard** (radar of strengths/weaknesses, timeline, "worst
      moves") + a **natural-language coach brief** (LLM over the computed stats —
      this is where our Claude integration fits).
    - Generate a **personalized to-do**: drill your worst positions (Phase 2 #6),
      shore up a weak opening (Phase 4), tactics on your recurring themes (Phase 3).
    - **Engine cost is the blocker** — bulk-analyzing 25 games single-threaded in
      the browser is slow. Options: analyze at reduced depth, do it incrementally/
      in the background, or use an analysis server for this path only.
    - *Effort: XL* (bulk analysis + analytics + LLM + dashboard).

---

## 6. Key decisions to make before building

1. **Backend/persistence: none vs. lightweight vs. full.**
   - *None (localStorage only):* keeps our free static + Vercel model; puzzles,
     streaks, trainer progress live on the device. Fastest to ship; no leaderboards.
   - *Lightweight (serverless + hosted DB, e.g. Vercel + Postgres/Supabase):*
     enables accounts, cross-device sync, leaderboards. Modest cost.
   - **Recommendation:** ship Phases 1–4 with **localStorage**, add accounts (Phase
     5) only if we want social/cross-device.

2. **Puzzle data hosting** — bundle a curated subset (simple, static) vs. host the
   full Lichess DB behind an API (needs storage/DB). Start bundled.

3. **Engine speed for the coach** — accept slow client-side bulk analysis, or
   stand up the optional analysis server (previously discussed) just for `/coach`.

4. **Stockfish 16 → 17** — chessigma uses 17. Worth an upgrade for parity, but
   keep our single-threaded build for reliability.

---

## 7. Suggested near-term sequence

A pragmatic order that ships value every step, no backend until forced:

1. **Elo Calculator** (XS) — trivial, instant "Tools" win.
2. **Next-Move Calculator** (S).
3. **Board Editor** (S).
4. **Username game import + picker** (M) — biggest UX unlock; feeds everything.
5. **Analysis Board free-play + variations** (M).
6. **Blunder drill from a reviewed game** (S–M).
7. **Puzzles (bundled subset, localStorage rating)** (L).
8. **Daily puzzle + streak** (S).
9. *Decision point:* accounts/DB → then Opening Trainer, Leaderboards, Wrapped, Coach.

Items 1–6 are all achievable on our current static + proxy architecture and would
already make us a credible free alternative for the "analyze + tools" use case.
The coach and social features are where a backend (and possibly a server-side
engine) become worth the investment.
