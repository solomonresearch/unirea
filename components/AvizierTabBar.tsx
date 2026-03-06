'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/ziar', label: 'Ziar', dotStyle: { background: 'var(--ink3)' } as React.CSSProperties },
  { href: '/avizier', label: 'Avizier', dotStyle: { background: 'var(--ink)', boxShadow: '0 0 0 1px var(--border)' } as React.CSSProperties },
]

export function AvizierTabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/avizier') return pathname === '/avizier'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div className="fixed top-[16px] left-0 right-0 z-40 border-b" style={{ background: 'var(--white)', borderColor: 'var(--border)' }}>
      <div className="mx-auto max-w-sm flex items-center justify-center gap-1 py-2 px-4">
        {TABS.map(({ href, label, dotStyle }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={active
                ? { background: 'var(--cream2)', color: 'var(--ink)' }
                : { color: 'var(--ink3)' }
              }
            >
              <span className="w-2 h-2 rounded-full" style={dotStyle} />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
