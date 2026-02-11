'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  color: string
  size: number
}

interface Rocket {
  x: number
  y: number
  vy: number
  targetY: number
  exploded: boolean
  color: string
}

const COLORS = ['#7E191B', '#D65456', '#EC9A9B', '#FFD700', '#FF6B35', '#FFFFFF', '#F5C4C5']

export function Fireworks({ duration = 4000 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    const particles: Particle[] = []
    const rockets: Rocket[] = []
    let animId: number
    let startTime = Date.now()

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas!.width = w
      canvas!.height = h
    }
    window.addEventListener('resize', resize)

    function spawnRocket() {
      rockets.push({
        x: Math.random() * w * 0.8 + w * 0.1,
        y: h,
        vy: -(Math.random() * 4 + 6),
        targetY: Math.random() * h * 0.4 + h * 0.1,
        exploded: false,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    function explode(rocket: Rocket) {
      const count = 40 + Math.floor(Math.random() * 30)
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = Math.random() * 4 + 1.5
        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: Math.random() * 2.5 + 1,
        })
      }
    }

    let lastRocket = 0

    function animate() {
      const elapsed = Date.now() - startTime

      ctx!.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx!.fillRect(0, 0, w, h)

      // Spawn rockets
      if (elapsed - lastRocket > 300 + Math.random() * 400 && elapsed < duration - 800) {
        spawnRocket()
        lastRocket = elapsed
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        if (!r.exploded) {
          r.y += r.vy
          // Draw rocket trail
          ctx!.beginPath()
          ctx!.arc(r.x, r.y, 2, 0, Math.PI * 2)
          ctx!.fillStyle = r.color
          ctx!.fill()

          if (r.y <= r.targetY) {
            r.exploded = true
            explode(r)
          }
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06
        p.alpha -= 0.012
        p.vx *= 0.99

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = p.alpha
        ctx!.fill()
        ctx!.globalAlpha = 1
      }

      if (elapsed < duration || particles.length > 0) {
        animId = requestAnimationFrame(animate)
      }
    }

    // Spawn a few immediately
    spawnRocket()
    spawnRocket()
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [duration])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}
