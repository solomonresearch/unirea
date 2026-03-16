'use client'

import { useRef, useState, useCallback } from 'react'
import { Archive, Trash2, Loader2 } from 'lucide-react'

interface SwipeableRowProps {
  children: React.ReactNode
  onArchive: () => void
  onDelete: () => void
  archiving?: boolean
  deleting?: boolean
}

const ARCHIVE_THRESHOLD = 80
const DELETE_THRESHOLD = 160

export function SwipeableRow({ children, onArchive, onDelete, archiving, deleting }: SwipeableRowProps) {
  const startX = useRef(0)
  const swiping = useRef(false)
  const [offset, setOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    swiping.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return
    const diff = startX.current - e.touches[0].clientX
    if (diff > 0) {
      setOffset(Math.min(diff, DELETE_THRESHOLD + 20))
    } else {
      setOffset(0)
    }
  }, [])

  const handleTouchEnd = useCallback((currentOffset: number) => {
    swiping.current = false
    if (currentOffset >= DELETE_THRESHOLD - 20) {
      setOffset(DELETE_THRESHOLD)
    } else if (currentOffset >= ARCHIVE_THRESHOLD - 20) {
      setOffset(ARCHIVE_THRESHOLD)
    } else {
      setOffset(0)
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons behind — Delete (left, red) + Archive (right, gray) */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{ width: DELETE_THRESHOLD }}
      >
        <button
          type="button"
          onClick={() => { if (!deleting) { onDelete(); setOffset(0) } }}
          className="flex flex-col items-center justify-center gap-0.5 text-white flex-1"
          style={{ background: '#ef4444' }}
        >
          {deleting
            ? <Loader2 size={18} className="animate-spin" />
            : <><Trash2 size={18} /><span className="text-[10px] font-medium">Șterge</span></>
          }
        </button>
        <button
          type="button"
          onClick={() => { if (!archiving) { onArchive(); setOffset(0) } }}
          className="flex flex-col items-center justify-center gap-0.5 text-white flex-1"
          style={{ background: '#6b7280' }}
        >
          {archiving
            ? <Loader2 size={18} className="animate-spin" />
            : <><Archive size={18} /><span className="text-[10px] font-medium">Arhivează</span></>
          }
        </button>
      </div>

      {/* Foreground content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          const diff = startX.current - e.changedTouches[0].clientX
          handleTouchEnd(Math.max(0, diff))
        }}
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
