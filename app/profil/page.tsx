'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/setari')
  }, [router])

  return null
}
