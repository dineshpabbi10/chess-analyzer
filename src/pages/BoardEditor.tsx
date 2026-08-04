import { useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { PageShell } from '../components/Nav'
import { navigate } from '../lib/router'
import { IconFlip } from '../components/Icons'

const START_BOARD = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
const PIECES = ['K', 'Q', 'R', 'B', 'N', 'P'] as const
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

/** Board state as a map of square -> piece char (uppercase = white). */
type Squares = Map<string, string>

function boardToSquares(boardFen: string): Squares {
  const map: Squares = new Map()
  const rows = boardFen.split('/')
  for (let r = 0; r < 8; r++) {
    const rank = 8 - r
    let file = 0
    for (const ch of rows[r] ?? '') {
      if (ch >= '1' && ch <= '8') file += parseInt(ch, 10)
      else {
        map.set(FILES[file] + rank, ch)
        file++
      }
    }
  }
  return map
}

function squaresToBoardFen(sq: Squares): string {
  const rows: string[] = []
  for (let rank = 8; rank >= 1; rank--) {
    let row = ''
    let empty = 0
    for (let f = 0; f < 8; f++) {
      const p = sq.get(FILES[f] + rank)
      if (p) {
        if (empty) {
          row += empty
          empty = 0
        }
        row += p
      } else empty++
    }
    if (empty) row += empty
    rows.push(row)
  }
  return rows.join('/')
}

export function BoardEditor() {
  const [squares, setSquares] = useState<Squares>(() => boardToSquares(START_BOARD))
  const [tool, setTool] = useState<string>('P') // selected piece, or '' for erase
  const [turn, setTurn] = useState<'w' | 'b'>('w')
  const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true })
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const fen = useMemo(() => {
    const rights =
      (castling.K ? 'K' : '') + (castling.Q ? 'Q' : '') + (castling.k ? 'k' : '') + (castling.q ? 'q' : '')
    return `${squaresToBoardFen(squares)} ${turn} ${rights || '-'} - 0 1`
  }, [squares, turn, castling])

  // chess.js is the source of truth for legality (kings present, no pawns on the
  // back rank, side-to-move not already delivering check, etc.).
  const problem = useMemo(() => {
    try {
      new Chess(fen)
      return null
    } catch (e: any) {
      return String(e?.message || 'Invalid position').replace(/^Invalid FEN:\s*/i, '')
    }
  }, [fen])

  const pgn = useMemo(() => {
    if (problem) return ''
    const isStart = fen.startsWith(START_BOARD + ' w KQkq')
    const headers = ['[Event "Position"]', '[White "?"]', '[Black "?"]', '[Result "*"]']
    if (!isStart) headers.push('[SetUp "1"]', `[FEN "${fen}"]`)
    return headers.join('\n') + '\n\n*'
  }, [fen, problem])

  function paint(square: string) {
    setSquares((prev) => {
      const next = new Map(prev)
      if (!tool) next.delete(square)
      else if (next.get(square) === tool) next.delete(square) // tap again to clear
      else next.set(square, tool)
      return next
    })
  }

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      setCopied(null)
    }
  }

  const cells: React.ReactElement[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const f = flipped ? 7 - col : col
      const rank = flipped ? row + 1 : 8 - row
      const sqName = FILES[f] + rank
      const dark = (f + rank) % 2 === 0
      const piece = squares.get(sqName)
      cells.push(
        <button
          key={sqName}
          className={`sq ed-sq ${dark ? 'dark' : 'light'}`}
          onClick={() => paint(sqName)}
          aria-label={sqName}
        >
          {col === 0 && <span className="coord rank">{rank}</span>}
          {row === 7 && <span className="coord file">{FILES[f]}</span>}
          {piece && (
            <img
              className="piece"
              draggable={false}
              alt={piece}
              src={`/pieces/${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toUpperCase()}.svg`}
            />
          )}
        </button>,
      )
    }
  }

  return (
    <PageShell
      title="Board Editor"
      subtitle="Set up any position, then copy the FEN or send it straight to the engine."
    >
      <div className="tool-grid tool-grid-board">
        <div className="card card-board">
          <div className="board editor-board">{cells}</div>
          <div className="btn-row">
            <button className="ghost" onClick={() => setFlipped((v) => !v)}>
              <IconFlip size={17} /> Flip
            </button>
            <button className="ghost" onClick={() => setSquares(boardToSquares(START_BOARD))}>
              Start position
            </button>
            <button className="ghost" onClick={() => setSquares(new Map())}>
              Clear board
            </button>
          </div>
        </div>

        <div className="card">
          <div className="field">
            <span>Click a piece, then click the board</span>
            <div className="palette">
              {(['w', 'b'] as const).map((color) => (
                <div className="palette-row" key={color}>
                  {PIECES.map((p) => {
                    const val = color === 'w' ? p : p.toLowerCase()
                    return (
                      <button
                        key={val}
                        className={`palette-btn${tool === val ? ' on' : ''}`}
                        onClick={() => setTool(val)}
                        aria-label={`${color === 'w' ? 'White' : 'Black'} ${p}`}
                      >
                        <img src={`/pieces/${color}${p}.svg`} alt="" draggable={false} />
                      </button>
                    )
                  })}
                </div>
              ))}
              <button
                className={`palette-btn erase${tool === '' ? ' on' : ''}`}
                onClick={() => setTool('')}
              >
                Erase
              </button>
            </div>
          </div>

          <div className="field">
            <span>Side to move</span>
            <div className="chip-row">
              <button className={`chip${turn === 'w' ? ' on' : ''}`} onClick={() => setTurn('w')}>
                White
              </button>
              <button className={`chip${turn === 'b' ? ' on' : ''}`} onClick={() => setTurn('b')}>
                Black
              </button>
            </div>
          </div>

          <div className="field">
            <span>Castling rights</span>
            <div className="chip-row">
              {(
                [
                  ['K', 'White O-O'],
                  ['Q', 'White O-O-O'],
                  ['k', 'Black O-O'],
                  ['q', 'Black O-O-O'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={`chip${castling[key] ? ' on' : ''}`}
                  onClick={() => setCastling((c) => ({ ...c, [key]: !c[key] }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {problem && <div className="error">{problem}</div>}

          <label className="field">
            <span>FEN</span>
            <textarea rows={3} readOnly value={fen} spellCheck={false} />
          </label>
          <div className="btn-row">
            <button className="ghost" onClick={() => copy(fen, 'FEN')}>
              {copied === 'FEN' ? 'Copied!' : 'Copy FEN'}
            </button>
            <button className="ghost" onClick={() => copy(pgn, 'PGN')} disabled={!pgn}>
              {copied === 'PGN' ? 'Copied!' : 'Copy PGN'}
            </button>
            <button
              className="primary"
              disabled={!!problem}
              onClick={() => navigate(`/tools/next-move?fen=${encodeURIComponent(fen)}`)}
            >
              Analyze position
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
