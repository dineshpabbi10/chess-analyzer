// Curated opening repertoire, stored as SAN move lists.
//
// This is deliberately static (not fetched) so the trainer works offline and the
// lines are *taught* rather than just "most popular move" statistics. Every line
// here is validated against chess.js by a test — see scripts/validate-openings.
//
// `moves` are the full line in SAN starting from the initial position. Whose turn
// it is follows from the ply index, so the trainer knows which moves the learner
// has to find (their side) and which it should play automatically.

export interface OpeningLine {
  name: string
  moves: string[]
  /** One-line takeaway shown when the line is completed. */
  idea: string
}

export interface Opening {
  id: string
  name: string
  side: 'w' | 'b'
  eco: string
  summary: string
  tags: string[]
  lines: OpeningLine[]
}

export const OPENINGS: Opening[] = [
  {
    id: 'italian',
    name: 'Italian Game',
    side: 'w',
    eco: 'C50',
    summary:
      'Classical development aimed at f7. Build the centre with c3 and d4, and punish loose play in the centre.',
    tags: ['Aggressive', 'Beginner-friendly'],
    lines: [
      {
        name: 'Giuoco Piano (main line)',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+'],
        idea: 'c3 then d4 is the plan: hit the centre while your pieces are already out.',
      },
      {
        name: 'Two Knights, Fried Liver',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'],
        idea: 'Ng5 hits f7 twice. If Black grabs with Nxd5, Nxf7 drags the king out.',
      },
      {
        name: 'Two Knights, correct defence',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5'],
        idea: 'Na5! is the right way for Black — remember it so you are not the one falling for it.',
      },
    ],
  },
  {
    id: 'ruy-lopez',
    name: 'Ruy Lopez',
    side: 'w',
    eco: 'C60',
    summary:
      'Pressure the knight that guards e5. Slow, strong, and the backbone of classical chess.',
    tags: ['Positional'],
    lines: [
      {
        name: 'Morphy Defence',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5'],
        idea: 'Castle, play Re1, and keep the tension — you are building, not attacking yet.',
      },
      {
        name: 'Exchange Variation',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6', 'dxc6', 'O-O'],
        idea: 'Trading on c6 hands Black doubled pawns; a simple way to play for a small edge.',
      },
    ],
  },
  {
    id: 'london',
    name: 'London System',
    side: 'w',
    eco: 'D02',
    summary:
      'One easy setup against almost anything: d4, Bf4, e3, Nf3, Bd3, c3. Low theory, very solid.',
    tags: ['Positional', 'Beginner-friendly'],
    lines: [
      {
        name: 'Standard setup',
        moves: ['d4', 'Nf6', 'Bf4', 'd5', 'e3', 'e6', 'Nf3', 'Bd6', 'Bg3', 'O-O', 'Bd3'],
        idea: 'When Black offers to trade with Bd6, sidestep to Bg3 and keep your good bishop.',
      },
      {
        name: 'Against the King’s Indian setup',
        moves: ['d4', 'Nf6', 'Bf4', 'g6', 'Nc3', 'd5', 'e3', 'Bg7', 'Nf3', 'O-O', 'Be2'],
        idea: 'Against ...g6 add Nc3 first — you keep the same comfortable structure.',
      },
    ],
  },
  {
    id: 'sicilian',
    name: 'Sicilian Defence',
    side: 'b',
    eco: 'B20',
    summary:
      'Answer 1.e4 with 1...c5: fight for the centre asymmetrically and play for a win with Black.',
    tags: ['Aggressive', 'Sharp'],
    lines: [
      {
        name: 'Najdorf',
        moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
        idea: '...a6 stops Nb5 and prepares ...e5 or ...b5. The most flexible Sicilian.',
      },
      {
        name: 'Dragon',
        moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'],
        idea: 'Fianchetto the bishop to g7 — it stares down the long diagonal all game.',
      },
      {
        name: 'Accelerated Dragon',
        moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6'],
        idea: 'Reaching a Dragon setup without committing to ...d6 first.',
      },
    ],
  },
  {
    id: 'caro-kann',
    name: 'Caro-Kann',
    side: 'b',
    eco: 'B10',
    summary:
      'Solid answer to 1.e4: support ...d5 with the c-pawn so your structure never cracks.',
    tags: ['Positional', 'Defensive'],
    lines: [
      {
        name: 'Classical',
        moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
        idea: 'Develop the bishop outside the pawn chain before playing ...e6.',
      },
      {
        name: 'Advance Variation',
        moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'c5'],
        idea: 'When White pushes e5, hit the base of the chain with ...c5.',
      },
    ],
  },
  {
    id: 'french',
    name: 'French Defence',
    side: 'b',
    eco: 'C00',
    summary:
      'Meet 1.e4 with ...e6 and ...d5, then break the centre with ...c5. Tough and strategic.',
    tags: ['Positional', 'Defensive'],
    lines: [
      {
        name: 'Advance Variation',
        moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6'],
        idea: '...c5 and ...Qb6 pile onto d4 — the whole game is about that pawn.',
      },
      {
        name: 'Classical / Steinitz',
        moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7', 'f4', 'c5'],
        idea: 'Retreat to Nfd7 (not Ne4) and immediately challenge with ...c5.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Progress (localStorage, no account needed)
// ---------------------------------------------------------------------------

const KEY = 'fca.openings.v1'

/** Set of "openingId/lineIndex" keys the learner has completed. */
export type OpeningProgress = Record<string, true>

export function lineKey(openingId: string, lineIndex: number) {
  return `${openingId}/${lineIndex}`
}

export function loadOpeningProgress(): OpeningProgress {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as OpeningProgress) : {}
  } catch {
    return {}
  }
}

export function markLineLearned(openingId: string, lineIndex: number): OpeningProgress {
  const p = loadOpeningProgress()
  p[lineKey(openingId, lineIndex)] = true
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage blocked — progress just won't persist */
  }
  return p
}

export function learnedCount(opening: Opening, progress: OpeningProgress): number {
  return opening.lines.reduce(
    (n, _l, i) => n + (progress[lineKey(opening.id, i)] ? 1 : 0),
    0,
  )
}
