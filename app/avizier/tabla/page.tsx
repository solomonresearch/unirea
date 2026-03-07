'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TablaRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/avizier?scope=clasa')
  }, [router])

  return null
}
