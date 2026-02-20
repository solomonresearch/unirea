'use client'

import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { Logo } from '@/components/Logo'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function HartaPage() {
  const [ready, setReady] = useState(false)
  const [mapHeight, setMapHeight] = useState(500)

  useEffect(() => {
    setMapHeight(window.innerHeight - 124)
    setReady(true)
  }, [])

  return (
    <main>
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4">
        <Logo size={28} />
        <span className="text-lg font-bold text-gray-900">Harta</span>
      </div>

      {/* Map with fixed pixel height */}
      <div style={{ height: mapHeight }}>
        {!ready ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-primary-700" />
          </div>
        ) : (
          <MapView />
        )}
      </div>

      <BottomNav />
    </main>
  )
}
