'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Megaphone, Users, MessageCircle, Search, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/tabla', label: 'Tabla', icon: BookOpen },
  { href: '/avizier', label: 'Avizier', icon: Megaphone },
  { href: '/colegi', label: 'Colegi', icon: Users },
  { href: '/mesaje', label: 'Mesaje', icon: MessageCircle },
  { href: '/cauta', label: 'Cauta', icon: Search },
  { href: '/setari', label: 'Setari', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-50">
      <div className="mx-auto max-w-sm flex items-center justify-around py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-[11px] font-medium transition-colors ${
                active ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
