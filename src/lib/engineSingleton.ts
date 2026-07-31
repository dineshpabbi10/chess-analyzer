import { Engine } from './engine'

// One shared engine for the whole app (the review page and every tool page),
// created lazily on first use so opening the site never boots a WASM worker.
// A FAILED load is never cached: engineRef stays null so the next call retries
// fresh (and Engine.init can fall back to the single-threaded build).
let engine: Engine | null = null
let inflight: Promise<Engine> | null = null

const listeners = new Set<(loading: boolean) => void>()

/** Subscribe to "engine is loading" changes (for spinners). Returns unsubscribe. */
export function onEngineLoading(fn: (loading: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit(loading: boolean) {
  for (const fn of listeners) fn(loading)
}

export function getSharedEngine(): Promise<Engine> {
  if (engine) return Promise.resolve(engine)
  if (!inflight) {
    emit(true)
    const p = (async () => {
      const e = new Engine()
      await e.init()
      engine = e
      return e
    })()
    p.then(
      () => {
        inflight = null
        emit(false)
      },
      () => {
        inflight = null // allow a fresh retry after a failure
        emit(false)
      },
    )
    inflight = p
  }
  return inflight
}
