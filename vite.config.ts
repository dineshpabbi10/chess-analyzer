import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// These headers make the page "cross-origin isolated", which enables
// SharedArrayBuffer + threads for the multi-threaded Stockfish build. Safe here
// because every resource we load (engine, pieces, /api) is same-origin.
const coopCoep = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: coopCoep,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  preview: {
    port: 4173,
    headers: coopCoep,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // stockfish worker + wasm live in public/engine and are served as-is
})
