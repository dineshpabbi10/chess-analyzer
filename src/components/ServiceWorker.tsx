'use client'

import { useEffect } from 'react'

/**
 * Registers the PWA service worker in production only (in dev it would cache
 * Next's HMR assets). When a new version activates we reload once, so a fresh
 * deploy never leaves the user on a stale cached shell.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const hadController = !!navigator.serviceWorker.controller
    let refreshing = false
    const onChange = () => {
      if (refreshing || !hadController) return // skip the initial claim
      refreshing = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onChange)
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is optional */
    })
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onChange)
  }, [])

  return null
}
