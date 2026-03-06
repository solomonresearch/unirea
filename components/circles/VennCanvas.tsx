'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  type CircleKey, type CirclePosition, type IntersectionDot,
  CIRCLE_COLORS, CIRCLE_CONFIG,
} from './circleConfig'

interface VennCanvasProps {
  circles: CircleKey[]
  positions: CirclePosition[]
  dots: IntersectionDot[]
  activeFilters: CircleKey[]
  counts: Record<string, number>
}

const CANVAS_W = 700
const CANVAS_H = 480
const CENTER_X = 0.5 * CANVAS_W
const CENTER_Y = 0.48 * CANVAS_H
const CENTER_R = 18
const RING_RADII = [55, 105, 155]

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function VennCanvas({ circles, positions, dots, activeFilters, counts }: VennCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const phaseRef = useRef(0)
  const rafRef = useRef<number>(0)
  const hoverCenterRef = useRef(false)

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const W = CANVAS_W
    const H = CANVAS_H
    const phase = phaseRef.current
    const hoveringCenter = hoverCenterRef.current

    ctx.clearRect(0, 0, W, H)

    // --- Concentric rings (behind everything) ---
    for (const ringR of RING_RADII) {
      ctx.beginPath()
      ctx.arc(CENTER_X, CENTER_Y, ringR, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 6])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // --- Connector lines from center to each circle ---
    for (let i = 0; i < circles.length; i++) {
      const pos = positions[i]
      const key = circles[i]
      const color = CIRCLE_COLORS[key]
      const cx = pos.x * W
      const cy = pos.y * H
      const isActive = activeFilters.includes(key)

      ctx.beginPath()
      ctx.moveTo(CENTER_X, CENTER_Y)
      ctx.lineTo(cx, cy)
      ctx.strokeStyle = hexToRgba(color, isActive ? 0.15 : 0.06)
      ctx.lineWidth = 1
      ctx.setLineDash([3, 5])
      ctx.stroke()
      ctx.setLineDash([])
    }

    // --- Category circles ---
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
      ctx.font = isActive ? 'bold 13px sans-serif' : '13px sans-serif'
      ctx.fillStyle = hexToRgba(color, isActive ? 0.8 : 0.4)
      ctx.textAlign = 'center'
      ctx.fillText(`${cfg.emoji} ${cfg.label}`, cx, labelY)
    }

    // --- Intersection dots ---
    for (const dot of dots) {
      const allActive = dot.circles.every(c => activeFilters.includes(c))
      const someActive = activeFilters.length === 0 || dot.circles.some(c => activeFilters.includes(c))
      if (!someActive) continue

      const px = W * dot.x
      const py = H * dot.y
      const baseDotR = dot.circles.length >= 3 ? 14 : 9
      const glowAlpha = allActive ? 1.0 : 0.3

      const r = baseDotR + Math.sin(phase * 2) * 1.5
      ctx.beginPath()
      ctx.arc(px, py, r, 0, Math.PI * 2)
      ctx.fillStyle = hexToRgba(dot.color, glowAlpha * 0.78)
      ctx.fill()

      if (allActive) {
        const ringR = baseDotR + 16 + Math.sin(phase) * 5
        ctx.beginPath()
        ctx.arc(px, py, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = hexToRgba(dot.color, 0.2)
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // --- "Eu" center circle ---
    const centerPulse = Math.sin(phase * 1.5) * 2
    const euR = CENTER_R + (hoveringCenter ? 4 : 0) + centerPulse

    const euGrad = ctx.createRadialGradient(CENTER_X, CENTER_Y, 0, CENTER_X, CENTER_Y, euR)
    const euAlpha = hoveringCenter ? 0.9 : 0.7
    euGrad.addColorStop(0, `rgba(46,205,167,${euAlpha})`)
    euGrad.addColorStop(1, `rgba(74,156,255,${euAlpha * 0.8})`)

    ctx.beginPath()
    ctx.arc(CENTER_X, CENTER_Y, euR, 0, Math.PI * 2)
    ctx.fillStyle = euGrad
    ctx.fill()

    // Subtle ring around center
    ctx.beginPath()
    ctx.arc(CENTER_X, CENTER_Y, euR + 3, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(46,205,167,${hoveringCenter ? 0.4 : 0.15})`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // "Eu" label
    if (hoveringCenter) {
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.textAlign = 'center'
      ctx.fillText('Eu', CENTER_X, CENTER_Y - euR - 8)
    }

    // Small dot in center for visual anchor
    ctx.beginPath()
    ctx.arc(CENTER_X, CENTER_Y, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const scaleY = CANVAS_H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const dist = Math.sqrt((mx - CENTER_X) ** 2 + (my - CENTER_Y) ** 2)
    hoverCenterRef.current = dist <= CENTER_R + 8
  }, [])

  const handleMouseLeave = useCallback(() => {
    hoverCenterRef.current = false
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full"
        style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label={`Diagrama Venn cu ${circles.length} cercuri${activeFilters.length > 0 ? `, ${activeFilters.length} active` : ''}`}
      />
    </div>
  )
}
