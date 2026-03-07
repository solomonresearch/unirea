'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AvizierZiarRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/ziar')
  }, [router])

  return null
}
