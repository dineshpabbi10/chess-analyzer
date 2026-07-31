import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Minimal History-API router — enough for a handful of pages, no dependency.
// Vercel rewrites every unmatched path to /index.html so deep links work.

const RouteCtx = createContext<string>('/')

function currentPath(): string {
  return typeof window === 'undefined' ? '/' : window.location.pathname.replace(/\/+$/, '') || '/'
}

export function navigate(to: string) {
  if (to === currentPath()) return
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(currentPath)
  useEffect(() => {
    const onPop = () => setPath(currentPath())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return <RouteCtx.Provider value={path}>{children}</RouteCtx.Provider>
}

export function useRoute(): string {
  return useContext(RouteCtx)
}

export function Link({
  to,
  className,
  children,
  onClick,
}: {
  to: string
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        // Let modified clicks (new tab, etc.) behave natively.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        e.preventDefault()
        onClick?.()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
