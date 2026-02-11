'use client'

import { Logo } from '@/components/Logo'
import { BottomNav } from '@/components/BottomNav'
import { Settings } from 'lucide-react'

export default function SetariPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-6 pb-24">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-lg font-bold text-gray-900">Setari</span>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Settings size={40} strokeWidth={1} />
          <p className="mt-3 text-sm">In curand</p>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
