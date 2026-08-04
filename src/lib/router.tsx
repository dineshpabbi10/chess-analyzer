'use client'

// Thin adapter over the Next App Router so the pages keep the small API they
// were written against (Link / navigate / useRoute) instead of every component
// importing next/navigation directly.

import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

/** Current pathname, normalised without a trailing slash ('/' stays '/'). */
export function useRoute(): string {
  const p = usePathname() || '/'
  return p.length > 1 ? p.replace(/\/+$/, '') : p
}

/**
 * Imperative navigation. Uses the Next router when called from inside a
 * component tree via useNavigate; the bare export falls back to a full
 * navigation, which is fine for the rare non-component call sites.
 */
export function navigate(to: string) {
  if (typeof window !== 'undefined') window.location.assign(to)
}

/** Preferred inside components: client-side navigation with no full reload. */
export function useNavigate() {
  const router = useRouter()
  return (to: string) => router.push(to)
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
    <NextLink href={to} className={className} onClick={onClick}>
      {children}
    </NextLink>
  )
}
