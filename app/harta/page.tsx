'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { Logo } from '@/components/Logo'
import { Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { CITY_COORDINATES } from '@/lib/city-coordinates'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export interface UserMarker {
  id: string
  name: string
  city: string
  lat: number
  lng: number
}

export default function HartaPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapHeight, setMapHeight] = useState(500)
  const [markers, setMarkers] = useState<UserMarker[]>([])

  useEffect(() => {
    setMapHeight(window.innerHeight - 124)

    async function load() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('highschool')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/autentificare'); return }

      const { data: colleagues } = await supabase
        .from('profiles')
        .select('id, name, city, country')
        .eq('highschool', profile.highschool)
        .eq('onboarding_completed', true)

      const userMarkers: UserMarker[] = []
      for (const c of colleagues || []) {
        if (!c.city) continue
        const coords = CITY_COORDINATES[c.city]
        if (coords) {
          userMarkers.push({
            id: c.id,
            name: c.name,
            city: c.city,
            lat: coords[0],
            lng: coords[1],
          })
        }
      }

      setMarkers(userMarkers)
      setLoading(false)
      setReady(true)
    }

    load()
  }, [router])

  return (
    <main>
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4">
        <Logo size={28} />
        <span className="text-lg font-bold text-gray-900">Harta</span>
        {!loading && markers.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {markers.length} {markers.length === 1 ? 'coleg' : 'colegi'}
          </span>
        )}
      </div>

      {/* Map */}
      <div style={{ height: mapHeight }}>
        {loading || !ready ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-primary-700" />
          </div>
        ) : (
          <MapView markers={markers} />
        )}
      </div>

      <BottomNav />
    </main>
  )
}
