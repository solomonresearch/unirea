'use client'

import { useRef, useState, useCallback } from 'react'
import { Archive, Loader2 } from 'lucide-react'

interface SwipeableRowProps {
  children: React.ReactNode
  onArchive: () => void
  archiving?: boolean
}

const THRESHOLD = 80

export function SwipeableRow({ children, onArchive, archiving }: SwipeableRowProps) {
  const startX = useRef(0)
  const currentX = useRef(0)
  const swiping = useRef(false)
  const [offset, setOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    swiping.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return
    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current
    if (diff > 0) {
      setOffset(Math.min(diff, THRESHOLD + 20))
    } else {
      setOffset(0)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    swiping.current = false
    if (offset >= THRESHOLD) {
      setOffset(THRESHOLD)
    } else {
      setOffset(0)
    }
  }, [offset])

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Archive button behind */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{
          width: THRESHOLD,
          background: 'var(--red, #ef4444)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (!archiving) {
              onArchive()
              setOffset(0)
            }
          }}
          className="flex flex-col items-center gap-0.5 text-white"
        >
          {archiving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Archive size={18} />
              <span className="text-[10px] font-medium">Arhiveaza</span>
            </>
          )}
        </button>
      </div>

      {/* Foreground content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(-${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
