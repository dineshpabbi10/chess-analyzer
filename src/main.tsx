import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register the PWA service worker (production builds only — in dev it would
// intercept and cache Vite's HMR assets). When a new version activates, reload
// once so a rebuilt app never gets stuck showing a stale cached shell.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const hadController = !!navigator.serviceWorker.controller
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return // skip the initial claim on first visit
    refreshing = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is optional; ignore registration failures */
    })
  })
}
