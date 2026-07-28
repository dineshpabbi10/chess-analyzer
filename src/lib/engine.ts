// Thin async wrapper around Stockfish 16 (WASM), run as a Web Worker from
// /public/engine. When the page is cross-origin isolated we load the
// multi-threaded build and give it N threads (much faster); otherwise we fall
// back to the single-threaded build. Analyses are queued so only one `go` is in
// flight at a time. MultiPV=2 so we learn the 2nd-best move too.

// Whether the page can use SharedArrayBuffer + threads (needs COOP/COEP headers).
export const isThreaded =
  typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated === true

// Threads to give the engine (leave one core for the UI). 1 when single-threaded.
export const engineThreads = isThreaded
  ? Math.max(1, Math.min(16, (navigator.hardwareConcurrency || 4) - 1))
  : 1

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

  // What the engine actually ended up running as (may differ from isThreaded
  // if the multi-threaded build failed to init and we fell back).
  public threaded = isThreaded
  public threads = engineThreads

  private send(cmd: string) {
    this.worker.postMessage(cmd)
  }

  // Boot one engine build and resolve once it reports `readyok`. Rejects on a
  // worker error or if init stalls (the multi-threaded build can hang on some
  // browsers) so init() can fall back to the single-threaded build.
  private boot(threaded: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const path = threaded
        ? '/engine/stockfish-nnue-16.js'
        : '/engine/stockfish-nnue-16-single.js'
      const threads = threaded ? engineThreads : 1
      const worker = new Worker(path)
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
          // NOTE: do NOT send "setoption name Use NNUE value true" — on the
          // multi-threaded build it triggers an eval-file reload that swallows
          // the readyok handshake and hangs init. SF16 uses NNUE by default.
          // Hash must stay <=128 on the threaded build: its WASM memory is
          // capped, and a larger hash silently overflows and never returns readyok.
          worker.postMessage(`setoption name Threads value ${threads}`)
          worker.postMessage(`setoption name Hash value ${threaded ? 128 : 64}`)
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
    try {
      await this.boot(this.threaded)
    } catch (err) {
      if (this.threaded) {
        // Multi-threaded build failed — fall back to the reliable single build.
        this.threaded = false
        this.threads = 1
        await this.boot(false)
      } else {
        throw err
      }
    }
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
