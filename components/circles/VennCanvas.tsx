'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  type Mode, type CircleKey,
  CIRCLE_POSITIONS, INTERSECTION_DOTS, CIRCLE_COLORS,
  PERSONAL_CIRCLES, PROFESSIONAL_CIRCLES, CIRCLE_CONFIG,
} from './circleConfig'

interface VennCanvasProps {
  mode: Mode
  activeFilters: CircleKey[]
  counts: Record<string, number>
  onIntersectionTap?: (key: string, label: string, x: number, y: number) => void
}

const CANVAS_W = 700
const CANVAS_H = 480

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function VennCanvas({ mode, activeFilters, counts, onIntersectionTap }: VennCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef(0)
  const rafRef = useRef<number>(0)

  const circles = mode === 'personal' ? PERSONAL_CIRCLES : PROFESSIONAL_CIRCLES
  const positions = CIRCLE_POSITIONS[mode]
  const dots = INTERSECTION_DOTS[mode]

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const W = CANVAS_W
    const H = CANVAS_H
    const phase = phaseRef.current

    ctx.clearRect(0, 0, W, H)

    for (let i = 0; i < circles.length; i++) {
      const key = circles[i]
      const pos = positions[i]
      const color = CIRCLE_COLORS[key]
      const isActive = activeFilters.includes(key)

      const cx = pos.x * W
      const cy = pos.y * H
      const baseR = pos.r * W * 0.48
      const radius = baseR + (isActive ? Math.sin(phase + i) * 3 : 0)

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      const alpha = isActive ? 0.20 : 0.06
      gradient.addColorStop(0, hexToRgba(color, 0.02))
      gradient.addColorStop(0.5, hexToRgba(color, alpha))
      gradient.addColorStop(1, hexToRgba(color, alpha * 2))

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      if (isActive) {
        ctx.strokeStyle = hexToRgba(color, 0.33)
        ctx.lineWidth = 2
        ctx.setLineDash([])
      } else {
        ctx.strokeStyle = hexToRgba(color, 0.09)
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
      }
      ctx.stroke()
      ctx.setLineDash([])

      const cfg = CIRCLE_CONFIG[key]
      const labelY = cy - radius + 18
      ctx.font = isActive ? 'bold 11px sans-serif' : '11px sans-serif'
      ctx.fillStyle = hexToRgba(color, isActive ? 0.8 : 0.4)
      ctx.textAlign = 'center'
      ctx.fillText(`${cfg.emoji} ${cfg.label}`, cx, labelY)
    }

    for (const dot of dots) {
      const allActive = dot.circles.every(c => activeFilters.includes(c))
      const someActive = activeFilters.length === 0 || dot.circles.some(c => activeFilters.includes(c))
      if (!someActive) continue

      const px = W * dot.x
      const py = H * dot.y
      const baseDotR = dot.circles.length >= 3 ? 7 : 4
      const glowAlpha = allActive ? 1.0 : 0.3

      const r = baseDotR + Math.sin(phase * 2) * 1.5
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(dot.color, glowAlpha * 0.78)
      ctx.fill()

      if (allActive) {
        const ringR = baseDotR + 12 + Math.sin(phase) * 4
        ctx.beginPath()
        ctx.arc(px, py, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = hexToRgba(dot.color, 0.2)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }, [circles, positions, dots, activeFilters])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function animate() {
      phaseRef.current += 0.025
      draw(ctx!)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!onIntersectionTap) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (CANVAS_W / rect.width)
    const y = (e.clientY - rect.top) * (CANVAS_H / rect.height)

    for (const dot of dots) {
      const px = CANVAS_W * dot.x
      const py = CANVAS_H * dot.y
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      if (dist < 30) {
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        onIntersectionTap(dot.key, dot.label, screenX, screenY)
        return
      }
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0D0F14' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleClick}
        className="w-full"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        aria-label={`Diagrama Venn cu ${circles.length} cercuri${activeFilters.length > 0 ? `, ${activeFilters.length} active` : ''}`}
      />
      {activeFilters.length >= 2 && (
        <div className="absolute top-3 right-3 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700' }}
        >
          {counts[getIntersectionKey(activeFilters)] || 0} suprapuneri ✨
        </div>
      )}
    </div>
  )
}

function getIntersectionKey(filters: CircleKey[]): string {
  const sorted = [...filters].sort()
  const map: Record<string, string> = {
    'highschool,location': 'hs_location',
    'highschool,hobbies': 'hs_hobbies',
    'hobbies,location': 'location_hobbies',
    'interests,location': 'location_interests',
    'highschool,hobbies,location': 'hs_location_hobbies',
    'highschool,profession': 'hs_profession',
    'location,profession': 'location_profession',
    'background,location': 'location_background',
    'background,profession': 'profession_background',
    'highschool,location,profession': 'hs_location_profession',
  }
  return map[sorted.join(',')] || ''
}
