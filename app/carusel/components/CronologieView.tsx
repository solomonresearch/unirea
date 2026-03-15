'use client'

import { useState, useRef, useEffect, useCallback, useMemo, RefObject } from 'react'
import type { CaruselPost } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const GRID_COLS  = 4
const CELL_GAP   = 2    // px between cells
const SCRUBBER_W = 20   // px — right rail width

// ── Cell size helpers ─────────────────────────────────────────────────────────

type CellSize = '1x1' | '2x2' | '2x3'
const CELL_SPANS: Record<CellSize, { col: number; row: number }> = {
  '1x1': { col: 1, row: 1 },
  '2x2': { col: 2, row: 2 },
  '2x3': { col: 2, row: 3 },
}

function getCellSize(id: string): CellSize {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  const n = Math.abs(h) % 10
  if (n === 0) return '2x2'
  if (n === 1) return '2x3'
  return '1x1'
}

// ── Month grouping ────────────────────────────────────────────────────────────

interface MonthGroup {
  key: string
  label: string
  posts: CaruselPost[]
}

function groupByMonth(posts: CaruselPost[]): MonthGroup[] {
  const map  = new Map<string, MonthGroup>()
  const keys: string[] = []

  for (const post of posts) {
    const d   = new Date(post.photo_date ?? post.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) {
      const label = d.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
      map.set(key, { key, label, posts: [] })
      keys.push(key)
    }
    map.get(key)!.posts.push(post)
  }

  return keys.map(k => map.get(k)!)
}

// ── Photo grid ────────────────────────────────────────────────────────────────

function PhotoGrid({
  posts,
  top8Ids,
  top8Ranks,
  onImageClick,
  cellSize,
}: {
  posts: CaruselPost[]
  top8Ids: Set<string>
  top8Ranks: Map<string, number>
  onImageClick: (post: CaruselPost) => void
  cellSize: number
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
        gridAutoRows: cellSize > 0 ? `${cellSize}px` : 'auto',
        gridAutoFlow: 'dense',
        gap: CELL_GAP,
      }}
    >
      {posts.map(post => {
        const size  = getCellSize(post.id)
        const spans = CELL_SPANS[size]
        const rank  = top8Ids.has(post.id) ? top8Ranks.get(post.id) : undefined

        return (
          <button
            key={post.id}
            onClick={() => onImageClick(post)}
            style={{
              gridColumn: `span ${spans.col}`,
              gridRow: `span ${spans.row}`,
              padding: 0,
              border: 'none',
              background: 'var(--border)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              display: 'block',
            }}
          >
            <img
              src={post.image_url}
              alt={post.caption || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            {rank && (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(20,18,16,0.65)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(245,208,106,0.4)',
                  borderRadius: 3,
                  padding: '1px 4px',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7,
                  fontWeight: 700,
                  color: '#F5D06A',
                  lineHeight: 1.4,
                  pointerEvents: 'none',
                }}
              >
                👑 #{rank}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Scrubber ──────────────────────────────────────────────────────────────────

interface MonthMark {
  key: string
  label: string
  fraction: number  // 0–1 within total scroll height
}

function Scrubber({
  scrollRef,
  marks,
}: {
  scrollRef: RefObject<HTMLDivElement>
  marks: MonthMark[]
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress]   = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [activeLabel, setActiveLabel] = useState(marks[0]?.label ?? '')

  // Track scroll → update thumb + active label
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const maxScroll = el.scrollHeight - el.clientHeight
      const p = maxScroll > 0 ? el.scrollTop / maxScroll : 0
      const clamped = Math.max(0, Math.min(1, p))
      setProgress(clamped)

      // Highest mark whose fraction ≤ current progress
      let label = marks[0]?.label ?? ''
      for (const m of marks) {
        if (m.fraction <= clamped + 0.01) label = m.label
      }
      setActiveLabel(label)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [scrollRef, marks])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const rail    = railRef.current
    const scrollEl = scrollRef.current
    if (!rail || !scrollEl) return

    const seek = (clientY: number) => {
      const rect  = rail.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      scrollEl.scrollTop = ratio * (scrollEl.scrollHeight - scrollEl.clientHeight)
    }

    seek(e.clientY)

    const onMove = (ev: PointerEvent) => seek(ev.clientY)
    const onUp   = () => {
      setIsDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [scrollRef])

  // Position helpers — leave 8px margin top/bottom so thumb doesn't clip
  const trackPct = `calc(8px + (100% - 16px) * ${progress})`

  return (
    <div
      ref={railRef}
      onPointerDown={handlePointerDown}
      style={{
        width: SCRUBBER_W,
        flexShrink: 0,
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Rail line */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 8,
          bottom: 8,
          width: 2,
          borderRadius: 1,
          background: 'var(--border)',
          pointerEvents: 'none',
        }}
      />

      {/* Month marker dots */}
      {marks.map(mark => (
        <div
          key={mark.key}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: `calc(8px + (100% - 16px) * ${mark.fraction})`,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--ink3)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Thumb */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: trackPct,
          transform: 'translateX(-50%) translateY(-50%)',
          width: isDragging ? 12 : 10,
          height: isDragging ? 12 : 10,
          borderRadius: '50%',
          background: 'var(--ink)',
          border: '2px solid var(--white)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'width 0.1s, height 0.1s',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Month label bubble — visible while dragging */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            right: SCRUBBER_W + 4,
            top: trackPct,
            transform: 'translateY(-50%)',
            background: 'var(--ink)',
            color: 'var(--white)',
            padding: '3px 7px',
            borderRadius: 4,
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {activeLabel}
        </div>
      )}
    </div>
  )
}

// ── CronologieView ────────────────────────────────────────────────────────────

interface CronologieViewProps {
  posts: CaruselPost[]
  userId: string | null
  isAdmin: boolean
  top8Ids: Set<string>
  top8Ranks: Map<string, number>
  onLike: (postId: string) => void
  onDelete: (postId: string) => void
  onImageClick: (post: CaruselPost) => void
}

export function CronologieView({
  posts,
  top8Ids,
  top8Ranks,
  onImageClick,
}: CronologieViewProps) {
  const scrollRef  = useRef<HTMLDivElement>(null)
  const widthRef   = useRef<HTMLDivElement>(null)   // probe for grid width
  const headerRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const [cellSize, setCellSize] = useState(0)
  const [marks, setMarks]       = useState<MonthMark[]>([])

  const groups = useMemo(() => groupByMonth(posts), [posts])

  // Measure available grid width → derive cell size
  useEffect(() => {
    const el = widthRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setCellSize(Math.floor((w - CELL_GAP * (GRID_COLS - 1)) / GRID_COLS))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // After grid renders, compute month mark fractions from header offsets
  useEffect(() => {
    if (cellSize === 0) return
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    // Wait one frame for the grid to paint at the correct height
    const id = requestAnimationFrame(() => {
      const totalH = scrollEl.scrollHeight
      if (totalH === 0) return

      const newMarks: MonthMark[] = []
      for (const group of groups) {
        const headerEl = headerRefs.current.get(group.key)
        if (!headerEl) continue
        // offsetTop relative to scroll container content
        const relTop = headerEl.getBoundingClientRect().top
          - scrollEl.getBoundingClientRect().top
          + scrollEl.scrollTop
        newMarks.push({ key: group.key, label: group.label, fraction: relTop / totalH })
      }
      setMarks(newMarks)
    })

    return () => cancelAnimationFrame(id)
  }, [groups, cellSize])

  if (posts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
        <p style={{ color: 'var(--ink3)', fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
          Nicio postare încă
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100svh - 224px)', overflow: 'hidden' }}>

      {/* ── Left: scrollable grid ── */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'scroll', minWidth: 0 }}
        className="scrollbar-hide"
      >
        {/* Width probe — sits at the top, invisible, gives us the content width */}
        <div ref={widthRef} style={{ width: '100%', height: 0, pointerEvents: 'none' }} />

        {groups.map(group => (
          <div key={group.key}>
            {/* Sticky month header */}
            <div
              ref={el => { if (el) headerRefs.current.set(group.key, el) }}
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                background: 'var(--cream2)',
                padding: '5px 6px 3px',
                fontFamily: "'Space Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink3)',
              }}
            >
              {group.label}
            </div>

            {/* Photo grid for this month */}
            <PhotoGrid
              posts={group.posts}
              top8Ids={top8Ids}
              top8Ranks={top8Ranks}
              onImageClick={onImageClick}
              cellSize={cellSize}
            />
          </div>
        ))}
      </div>

      {/* ── Right: scrubber ── */}
      <Scrubber scrollRef={scrollRef as RefObject<HTMLDivElement>} marks={marks} />
    </div>
  )
}
