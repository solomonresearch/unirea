'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

interface AnalyticsEvent {
  user_id: string
  event_type: string
  page: string
  target: string | null
  metadata: Record<string, unknown> | null
  session_id: string
}

let sessionId: string | null = null

function getSessionId(): string {
  if (sessionId) return sessionId
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('_sid')
    if (stored) { sessionId = stored; return stored }
    const id = crypto.randomUUID()
    sessionStorage.setItem('_sid', id)
    sessionId = id
    return id
  }
  return 'unknown'
}

let userId: string | null = null
let userIdPromise: Promise<string | null> | null = null

async function getUserId(): Promise<string | null> {
  if (userId) return userId
  if (userIdPromise) return userIdPromise
  userIdPromise = getSupabase().auth.getUser().then(({ data }) => {
    userId = data.user?.id || null
    return userId
  })
  return userIdPromise
}

const buffer: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

async function flush() {
  if (buffer.length === 0) return
  const batch = buffer.splice(0, buffer.length)
  try {
    await getSupabase().from('analytics_events').insert(batch)
  } catch {
    // Silent fail — analytics should never break the app
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, 3000)
}

async function pushEvent(
  eventType: string,
  page: string,
  target?: string | null,
  metadata?: Record<string, unknown> | null
) {
  const uid = await getUserId()
  if (!uid) return

  buffer.push({
    user_id: uid,
    event_type: eventType,
    page,
    target: target || null,
    metadata: metadata || null,
    session_id: getSessionId(),
  })
  scheduleFlush()
}

// Flush on page hide (tab close, navigate away)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

export function useTrack() {
  const pathname = usePathname()
  const pageViewLogged = useRef<string | null>(null)
  const enterTime = useRef(Date.now())

  useEffect(() => {
    if (pathname && pathname !== pageViewLogged.current) {
      // Log duration on previous page
      if (pageViewLogged.current) {
        const duration = Math.round((Date.now() - enterTime.current) / 1000)
        pushEvent('page_leave', pageViewLogged.current, null, { duration_seconds: duration })
      }

      pageViewLogged.current = pathname
      enterTime.current = Date.now()
      pushEvent('page_view', pathname)
    }
  }, [pathname])

  const track = useCallback((target: string, metadata?: Record<string, unknown>) => {
    if (pathname) {
      pushEvent('click', pathname, target, metadata)
    }
  }, [pathname])

  const trackEngagement = useCallback((target: string, metadata?: Record<string, unknown>) => {
    if (pathname) {
      pushEvent('engagement', pathname, target, metadata)
    }
  }, [pathname])

  return { track, trackEngagement }
}
