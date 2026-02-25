'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/ziar', label: 'Ziar', dotColor: 'bg-gray-400' },
  { href: '/avizier', label: 'Avizier', dotColor: 'bg-gray-800 ring-1 ring-gray-300' },
  { href: '/avizier/tabla', label: 'Tabla', dotColor: 'bg-gray-950' },
  { href: '/sondaje', label: 'Sondaje', dotColor: 'bg-blue-500' },
]

export function AvizierTabBar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/avizier') return pathname === '/avizier'
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="mx-auto max-w-sm flex items-center justify-center gap-1 py-2 px-6">
        {TABS.map(({ href, label, dotColor }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
