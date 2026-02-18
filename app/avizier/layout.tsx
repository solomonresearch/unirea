'use client'

import { AvizierTabBar } from '@/components/AvizierTabBar'
import { BottomNav } from '@/components/BottomNav'

export default function AvizierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AvizierTabBar />
      <div className="pt-11">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
