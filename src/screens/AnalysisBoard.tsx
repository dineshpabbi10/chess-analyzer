'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { PageShell } from '../components/Nav'
import { Board } from '../components/Board'
import { EvalBar } from '../components/EvalBar'
import { getSharedEngine } from '../lib/engineSingleton'
import { IconFirst, IconFlip, IconLast, IconNext, IconPrev } from '../components/Icons'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const SEARCH_MS = 1200 // bounded search so the eval keeps up with clicking

/** A node in the move tree. The root has no move and holds the start position. */
interface Node {
  id: number
  san: string | null
  uci: string | null
  fen: string // position AFTER the move
  parent: Node | null
  children: Node[]
  ply: number // 0 for root
}

let nextId = 1
function makeNode(fen: string, parent: Node | null, san: string | null, uci: string | null): Node {
  return { id: nextId++, san, uci, fen, parent, children: [], ply: parent ? parent.ply + 1 : 0 }
}

function pathToRoot(node: Node): Node[] {
  const out: Node[] = []
  let n: Node | null = node
  while (n) {
    out.unshift(n)
    n = n.parent
  }
  return out
}

/** Recursively render a line starting at `node` (which is a move node). */
function renderLine(
  node: Node,
  currentId: number,
  onPick: (n: Node) => void,
  depth = 0,
): React.ReactNode {
  const items: React.ReactNode[] = []
  let walker: Node | null = node
  while (walker) {
    // Bind the current node to a block-scoped const: the onClick closure must
    // capture *this* node, not the mutating loop variable (which ends as null).
    const cur: Node = walker
    const showNumber = cur.ply % 2 === 1 || items.length === 0
    const moveNo = Math.ceil(cur.ply / 2)
    items.push(
      <span key={cur.id} className="mt-move-wrap">
        {showNumber && (
          <span className="mt-num">
            {moveNo}
            {cur.ply % 2 === 1 ? '.' : '…'}
          </span>
        )}
        <button
          className={`mt-move${cur.id === currentId ? ' active' : ''}`}
          onClick={() => onPick(cur)}
        >
          {cur.san}
        </button>
      </span>,
    )
    // Sibling variations branch off the *parent*, after this move is shown.
    const siblings: Node[] = cur.parent ? cur.parent.children.slice(1) : []
    if (cur.parent && cur.parent.children[0] === cur && siblings.length && depth < 4) {
      for (const sib of siblings) {
        items.push(
          <span key={`v-${sib.id}`} className="mt-var">
            ({renderLine(sib, currentId, onPick, depth + 1)})
          </span>,
        )
      }
    }
    walker = cur.children[0] ?? null
  }
  return items
}

export function AnalysisBoard() {
  const [root, setRoot] = useState<Node>(() => makeNode(START, null, null, null))
  const [current, setCurrent] = useState<Node | null>(null) // null = root
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [loadText, setLoadText] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [engineOn, setEngineOn] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [evalState, setEvalState] = useState<{
    cp: number | null
    mate: number | null
    depth: number
    pvSan: string[]
    bestUci: string | null
  } | null>(null)

  const node = current ?? root
  const fen = node.fen
  const game = useMemo(() => {
    try {
      return new Chess(fen)
    } catch {
      return new Chess(START)
    }
  }, [fen])

  // Keep the URL in sync so a position can be shared/bookmarked.
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('fen', fen)
    window.history.replaceState({}, '', url)
  }, [fen])

  // Load ?fen= on first mount.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('fen')
    if (!q) return
    try {
      new Chess(q)
      setRoot(makeNode(q, null, null, null))
      setCurrent(null)
    } catch {
      /* ignore a bad ?fen= */
    }
  }, [])

  // ---- engine: analyze the current position, ignoring stale results ----
  const tokenRef = useRef(0)
  useEffect(() => {
    if (!engineOn) {
      setEvalState(null)
      return
    }
    if (game.isGameOver()) {
      setEvalState(null)
      setThinking(false)
      return
    }
    const token = ++tokenRef.current
    let cancelled = false
    setThinking(true)
    ;(async () => {
      try {
        const engine = await getSharedEngine()
        engine.stop() // cut short whatever is running for the previous position
        const raw = await engine.analyze(fen, { depth: 22, movetime: SEARCH_MS })
        if (cancelled || token !== tokenRef.current) return
        const c = new Chess(fen)
        const pvSan: string[] = []
        for (const uci of raw.pv) {
          try {
            const mv = c.move({
              from: uci.slice(0, 2),
              to: uci.slice(2, 4),
              promotion: uci.length > 4 ? uci[4] : undefined,
            })
            if (!mv) break
            pvSan.push(mv.san)
          } catch {
            break
          }
        }
        const whiteToMove = fen.split(' ')[1] === 'w'
        setEvalState({
          cp: raw.scoreCp == null ? null : whiteToMove ? raw.scoreCp : -raw.scoreCp,
          mate: raw.mate == null ? null : whiteToMove ? raw.mate : -raw.mate,
          depth: raw.depth,
          pvSan,
          bestUci: raw.bestMove || raw.pv[0] || null,
        })
      } catch {
        if (!cancelled) setEvalState(null)
      } finally {
        if (!cancelled && token === tokenRef.current) setThinking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fen, engineOn, game])

  // ---- making moves ----
  const playMove = useCallback(
    (from: string, to: string) => {
      const c = new Chess(fen)
      let mv
      try {
        mv = c.move({ from, to, promotion: 'q' })
      } catch {
        return false
      }
      if (!mv) return false
      // Reuse an existing child if this move was already explored.
      const existing = node.children.find((ch) => ch.uci === mv.lan)
      if (existing) {
        setCurrent(existing)
      } else {
        const child = makeNode(c.fen(), node, mv.san, mv.lan)
        node.children.push(child)
        setRoot((r) => ({ ...r })) // force re-render of the tree
        setCurrent(child)
      }
      return true
    },
    [fen, node],
  )

  const onSquareClick = useCallback(
    (sq: string) => {
      const piece = game.get(sq as never)
      if (selected) {
        if (sq === selected) {
          setSelected(null)
          return
        }
        if (playMove(selected, sq)) {
          setSelected(null)
          return
        }
        // Not a legal target — treat as picking a new piece (or clearing).
        setSelected(piece && piece.color === game.turn() ? sq : null)
        return
      }
      if (piece && piece.color === game.turn()) setSelected(sq)
    },
    [game, selected, playMove],
  )

  const targets = useMemo(() => {
    if (!selected) return []
    try {
      return game.moves({ square: selected as never, verbose: true }).map((m: any) => m.to)
    } catch {
      return []
    }
  }, [game, selected])

  // ---- navigation ----
  const goBack = useCallback(() => {
    setSelected(null)
    setCurrent(node.parent ? node.parent : null)
  }, [node])
  const goForward = useCallback(() => {
    setSelected(null)
    if (node.children[0]) setCurrent(node.children[0])
  }, [node])
  const goStart = useCallback(() => {
    setSelected(null)
    setCurrent(null)
  }, [])
  const goEnd = useCallback(() => {
    setSelected(null)
    let n = node
    while (n.children[0]) n = n.children[0]
    setCurrent(n === root ? null : n)
  }, [node, root])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') goBack()
      else if (e.key === 'ArrowRight') goForward()
      else if (e.key === 'Home') goStart()
      else if (e.key === 'End') goEnd()
      else if (e.key === 'f') setFlipped((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goBack, goForward, goStart, goEnd])

  // ---- load FEN or PGN ----
  const load = useCallback(() => {
    const text = loadText.trim()
    if (!text) return
    setLoadError(null)
    // PGN?
    if (/\[Event|\d+\s*\./.test(text)) {
      try {
        const c = new Chess()
        c.loadPgn(text)
        const history = c.history({ verbose: true })
        if (!history.length) throw new Error('That PGN has no moves.')
        const newRoot = makeNode(history[0].before, null, null, null)
        let cur = newRoot
        for (const mv of history) {
          const child = makeNode(mv.after, cur, mv.san, mv.lan)
          cur.children.push(child)
          cur = child
        }
        setRoot(newRoot)
        setCurrent(cur)
        setLoadText('')
        return
      } catch (e: any) {
        setLoadError(e?.message || 'Could not read that PGN.')
        return
      }
    }
    // Otherwise treat as FEN.
    try {
      new Chess(text)
      setRoot(makeNode(text, null, null, null))
      setCurrent(null)
      setLoadText('')
    } catch {
      setLoadError('That is neither a valid FEN nor a PGN.')
    }
  }, [loadText])

  const linePgn = useMemo(() => {
    const line = pathToRoot(node).filter((n) => n.san)
    if (!line.length) return ''
    let out = ''
    line.forEach((n, i) => {
      if (n.ply % 2 === 1) out += `${Math.ceil(n.ply / 2)}. `
      else if (i === 0) out += `${Math.ceil(n.ply / 2)}... `
      out += `${n.san} `
    })
    return out.trim()
  }, [node])

  const lastMove =
    node.uci && node.uci.length >= 4
      ? { from: node.uci.slice(0, 2), to: node.uci.slice(2, 4) }
      : null
  const bestArrow =
    evalState?.bestUci && evalState.bestUci.length >= 4
      ? { from: evalState.bestUci.slice(0, 2), to: evalState.bestUci.slice(2, 4) }
      : null

  const evalText = evalState
    ? evalState.mate != null
      ? `#${Math.abs(evalState.mate)}`
      : `${(evalState.cp ?? 0) >= 0 ? '+' : ''}${((evalState.cp ?? 0) / 100).toFixed(2)}`
    : '—'

  return (
    <PageShell
      title="Analysis Board"
      subtitle="Play moves, branch into variations, and read Stockfish's evaluation live. Load a FEN or PGN to start from any position."
    >
      <div className="ab-grid">
        <div className="ab-board-col">
          <div className="board-stack">
            <EvalBar cp={evalState?.cp ?? 0} mate={evalState?.mate ?? null} flipped={flipped} />
            <Board
              fen={fen}
              flipped={flipped}
              lastMove={lastMove}
              bestArrow={engineOn ? bestArrow : null}
              onSquareClick={onSquareClick}
              selected={selected}
              targets={targets}
            />
          </div>
          <div className="controls">
            <button onClick={goStart} title="Start (Home)" aria-label="Start">
              <IconFirst />
            </button>
            <button onClick={goBack} title="Back (←)" aria-label="Back">
              <IconPrev />
            </button>
            <button onClick={goForward} title="Forward (→)" aria-label="Forward">
              <IconNext />
            </button>
            <button onClick={goEnd} title="End (End)" aria-label="End">
              <IconLast />
            </button>
            <button onClick={() => setFlipped((v) => !v)} title="Flip (f)" aria-label="Flip board">
              <IconFlip />
            </button>
          </div>
          {game.isGameOver() && (
            <div className="ab-status">
              {game.isCheckmate()
                ? `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`
                : game.isDraw()
                  ? 'Draw'
                  : 'Game over'}
            </div>
          )}
        </div>

        <div className="ab-side">
          <div className="card ab-engine">
            <div className="ab-engine-head">
              <span className="ab-eval">{evalText}</span>
              <span className="ab-depth">
                {engineOn ? (thinking ? 'thinking…' : `depth ${evalState?.depth ?? 0}`) : 'engine off'}
              </span>
              <button className="ghost ab-toggle" onClick={() => setEngineOn((v) => !v)}>
                {engineOn ? 'Turn off' : 'Turn on'}
              </button>
            </div>
            {engineOn && evalState?.pvSan.length ? (
              <div className="ab-pv">{evalState.pvSan.join(' ')}</div>
            ) : null}
          </div>

          <div className="card">
            <div className="ab-tree-head">Moves</div>
            <div className="ab-tree">
              <button
                className={`mt-move mt-start${current === null ? ' active' : ''}`}
                onClick={goStart}
              >
                start
              </button>
              {root.children[0] ? renderLine(root.children[0], node.id, (n) => {
                setSelected(null)
                setCurrent(n)
              }) : <span className="dim"> — play a move to begin</span>}
            </div>
            {linePgn && (
              <div className="ab-line-pgn">
                <span className="result-label">Current line</span>
                <div className="pv-moves">{linePgn}</div>
              </div>
            )}
          </div>

          <div className="card">
            <label className="field">
              <span>Load a FEN or PGN</span>
              <textarea
                rows={3}
                value={loadText}
                spellCheck={false}
                placeholder="Paste a FEN or a full PGN…"
                onChange={(e) => setLoadText(e.target.value)}
              />
            </label>
            {loadError && <div className="error">{loadError}</div>}
            <div className="btn-row">
              <button className="primary" onClick={load} disabled={!loadText.trim()}>
                Load
              </button>
              <button
                className="ghost"
                onClick={() => {
                  setRoot(makeNode(START, null, null, null))
                  setCurrent(null)
                  setSelected(null)
                }}
              >
                New game
              </button>
            </div>
            <label className="field ab-fen-out">
              <span>Current FEN</span>
              <textarea rows={2} readOnly value={fen} spellCheck={false} />
            </label>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
