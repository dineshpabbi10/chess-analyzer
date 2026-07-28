// Thin async wrapper around the single-threaded Stockfish 16 WASM build.
// Runs as a Web Worker loaded from /public/engine. Analyses are queued so only
// one `go` is in flight at a time. MultiPV=2 so we learn the 2nd-best move too.

export interface Line {
  scoreCp: number | null // side-to-move POV
  mate: number | null // side-to-move POV
}

export interface RawEval {
  scoreCp: number | null // side-to-move POV (best move)
  mate: number | null // side-to-move POV (best move)
  bestMove: string | null // uci
  pv: string[]
  depth: number
  second: Line | null // engine's 2nd-best line (side-to-move POV)
}

type Pending = {
  resolve: (v: RawEval) => void
  best: RawEval
  secondDepth: number
}

export class Engine {
  private worker: Worker
  private ready: Promise<void>
  private queue: (() => void)[] = []
  private busy = false
  private current: Pending | null = null

  constructor() {
    this.worker = new Worker('/engine/stockfish-nnue-16-single.js')
    this.ready = new Promise((resolve) => {
      const onReady = (e: MessageEvent) => {
        const line = String(e.data)
        if (line === 'uciok') {
          this.send('setoption name Use NNUE value true')
          this.send('setoption name Hash value 64')
          this.send('setoption name MultiPV value 2')
          this.send('isready')
        } else if (line === 'readyok') {
          this.worker.removeEventListener('message', onReady)
          resolve()
        }
      }
      this.worker.addEventListener('message', onReady)
      this.worker.addEventListener('message', (e) => this.onMessage(String(e.data)))
      this.send('uci')
    })
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd)
  }

  init() {
    return this.ready
  }

  private onMessage(line: string) {
    if (!this.current) return
    if (line.startsWith('info') && line.includes(' pv ')) {
      const depthM = line.match(/\bdepth (\d+)/)
      const cpM = line.match(/score cp (-?\d+)/)
      const mateM = line.match(/score mate (-?\d+)/)
      const pvM = line.match(/ pv (.+)$/)
      const multiM = line.match(/multipv (\d+)/)
      if (!depthM) return
      const depth = parseInt(depthM[1], 10)
      const cp = cpM ? parseInt(cpM[1], 10) : null
      const mate = mateM ? parseInt(mateM[1], 10) : null
      const idx = multiM ? parseInt(multiM[1], 10) : 1
      if (idx === 1) {
        const cur = this.current.best
        if (depth >= cur.depth) {
          cur.depth = depth
          cur.scoreCp = cp
          cur.mate = mate
          if (pvM) cur.pv = pvM[1].trim().split(/\s+/)
        }
      } else if (idx === 2) {
        if (depth >= this.current.secondDepth) {
          this.current.secondDepth = depth
          this.current.best.second = { scoreCp: cp, mate }
        }
      }
    } else if (line.startsWith('bestmove')) {
      const m = line.match(/^bestmove (\S+)/)
      const best = this.current.best
      best.bestMove = m && m[1] !== '(none)' ? m[1] : best.pv[0] || null
      const p = this.current
      this.current = null
      p.resolve(best)
      this.busy = false
      this.pump()
    }
  }

  private pump() {
    if (this.busy) return
    const next = this.queue.shift()
    if (next) next()
  }

  analyze(fen: string, opts: { depth?: number; movetime?: number } = {}): Promise<RawEval> {
    return new Promise((resolve) => {
      const run = () => {
        this.busy = true
        this.current = {
          resolve,
          secondDepth: 0,
          best: { scoreCp: null, mate: null, bestMove: null, pv: [], depth: 0, second: null },
        }
        this.send('position fen ' + fen)
        const go = opts.movetime
          ? `go depth ${opts.depth ?? 22} movetime ${opts.movetime}`
          : `go depth ${opts.depth ?? 15}`
        this.send(go)
      }
      this.queue.push(run)
      this.pump()
    })
  }

  destroy() {
    try {
      this.send('quit')
      this.worker.terminate()
    } catch {
      /* noop */
    }
  }
}
