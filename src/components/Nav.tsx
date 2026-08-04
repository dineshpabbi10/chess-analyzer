import type { ReactNode } from 'react'

/**
 * Standard content wrapper for a tool/feature page: a title, an optional
 * subtitle, then the page body. Navigation is provided by AppShell (a sidebar on
 * desktop, a bottom tab bar on mobile), so pages don't render their own nav.
 */
export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="page">
      <div className="page-main">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
