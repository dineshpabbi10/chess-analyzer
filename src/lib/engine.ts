// Thin async wrapper around Stockfish 18 "lite, single-threaded" (WASM), run as a
// Web Worker from /public/engine. Analyses are queued so only one `go` is in
// flight at a time. MultiPV=2 so we learn the 2nd-best move too.
//
// Why this exact build:
//  - "lite" embeds a small NNUE net (~7 MB wasm), so there is no separate net to
//    download — the old SF16 setup shipped a 40 MB .nnue that was never loaded.
//  - "single" (single-threaded) never touches SharedArrayBuffer. The threaded
//    builds allocate shared memory up front, which threw
//    "WebAssembly.Memory(): could not allocate memory" on real devices and
//    crashed in nested pthread workers where it couldn't be caught cleanly.
//    Single-threaded uses a small growable, non-shared memory and runs anywhere.
export const ENGINE_NAME = 'Stockfish 18 Lite'
export const ENGINE_PATH = '/engine/stockfish-18-lite-single.js'

export const useThreads = false

// Single-threaded build → one engine thread.
export const engineThreads = 1

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
  private worker!: Worker
  private queue: (() => void)[] = []
  private busy = false
  private current: Pending | null = null

  // Always single-threaded (see useThreads above). Kept as fields for clarity.
  public threaded = useThreads
  public threads = engineThreads

  private send(cmd: string) {
    this.worker.postMessage(cmd)
  }

  // Boot the engine and resolve once it reports `readyok`. Rejects on a worker
  // error or if init stalls, so callers can retry (a failed engine is never
  // cached — see engineSingleton).
  private boot(): Promise<void> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(ENGINE_PATH)
      this.worker = worker
      let settled = false
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        try {
          worker.terminate()
        } catch {
          /* noop */
        }
        reject(new Error('engine init timed out'))
      }, 20000)

      const onReady = (e: MessageEvent) => {
        const line = String(e.data)
        if (line === 'uciok') {
          // Don't send "Use NNUE" — this build embeds its net and always uses it,
          // and on the old SF16 threaded build that option swallowed the readyok
          // handshake. Hash stays modest so memory growth is never an issue.
          worker.postMessage(`setoption name Threads value ${engineThreads}`)
          worker.postMessage('setoption name Hash value 64')
          worker.postMessage('setoption name MultiPV value 2')
          worker.postMessage('isready')
        } else if (line === 'readyok' && !settled) {
          settled = true
          clearTimeout(timer)
          worker.removeEventListener('message', onReady)
          resolve()
        }
      }
      worker.addEventListener('message', onReady)
      worker.addEventListener('message', (e) => this.onMessage(String(e.data)))
      worker.addEventListener('error', () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        try {
          worker.terminate()
        } catch {
          /* noop */
        }
        reject(new Error('engine worker error'))
      })
      worker.postMessage('uci')
    })
  }

  async init(): Promise<void> {
    await this.boot()
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

  /**
   * Ask the current search to finish early. The in-flight `analyze()` promise
   * still resolves (with whatever depth it reached), so callers stay consistent.
   * Used by the analysis board when the position changes mid-search.
   */
  stop() {
    if (this.busy) this.send('stop')
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
