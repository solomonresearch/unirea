'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SondajeRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/avizier')
  }, [router])

  return null
}
