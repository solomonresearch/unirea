'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HartaPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/cauta')
  }, [router])

  return null
}
