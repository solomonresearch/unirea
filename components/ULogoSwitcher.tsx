'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { LEVELS, useLevelContext } from '@/contexts/LevelContext'

const ARC_R = 118
const ANGLES = [18, 48, 76]
const HOLD_MS = 500
const CIRCUMFERENCE = 2 * Math.PI * 17 // ≈ 107

function nodeCenter(logoCx: number, logoCy: number, i: number) {
  const rad = ANGLES[i] * (Math.PI / 180)
  return {
    x: logoCx + ARC_R * Math.cos(rad),
    y: logoCy + ARC_R * Math.sin(rad),
  }
}

export function ULogoSwitcher() {
  const { levelIndex, level, switchLevel } = useLevelContext()
  const router = useRouter()

  const logoRef = useRef<HTMLDivElement>(null)
  const ringArcRef = useRef<SVGCircleElement>(null)
  const holdRafRef = useRef<number | null>(null)
  const holdStartRef = useRef<number>(0)
  const discOpenRef = useRef(false)
  const shimmerTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  // Logo center in viewport coords — captured on pointerdown so disc follows the real position
  const logoCxRef = useRef(32)
  const logoCyRef = useRef(28)

  const [discOpen, setDiscOpen] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)
  const [flashingNode, setFlashingNode] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const nodeControls = [useAnimation(), useAnimation(), useAnimation()]

  useEffect(() => {
    setMounted(true)
    return () => { shimmerTimersRef.current.forEach(clearTimeout) }
  }, [])

  // Shimmer scheduling
  useEffect(() => {
    if (!mounted) return

    function fireShimmer() {
      if (discOpenRef.current) return
      const el = logoRef.current
      if (!el) return
      el.classList.remove('shimmer')
      // Force reflow
      void el.offsetWidth
      el.classList.add('shimmer')
      const t = setTimeout(() => el.classList.remove('shimmer'), 700)
      shimmerTimersRef.current.push(t)
    }

    const t1 = setTimeout(() => {
      fireShimmer()
      const interval = setInterval(fireShimmer, 5000)
      shimmerTimersRef.current.push(t1)
      // Store interval cleanup
      const cleanup = () => clearInterval(interval)
      shimmerTimersRef.current.push(setTimeout(cleanup, 1000 * 60 * 60)) // 1h safety
    }, 2000)

    shimmerTimersRef.current.push(t1)
    return () => {
      shimmerTimersRef.current.forEach(clearTimeout)
      shimmerTimersRef.current = []
    }
  }, [mounted])

  const resetRing = useCallback(() => {
    if (ringArcRef.current) {
      ringArcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE)
    }
  }, [])

  const resetLogoShape = useCallback(() => {
    if (logoRef.current) {
      logoRef.current.style.borderRadius = '10px'
      logoRef.current.style.transform = 'scale(1)'
    }
  }, [])

  const cancelHold = useCallback(() => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
    resetRing()
    resetLogoShape()
  }, [resetRing, resetLogoShape])

  const openDisc = useCallback(() => {
    discOpenRef.current = true
    setDiscOpen(true)
    resetLogoShape()
  }, [resetLogoShape])

  const closeDisc = useCallback(() => {
    discOpenRef.current = false
    setDiscOpen(false)
    setHoveredNode(null)
    setFlashingNode(null)
    resetRing()
    resetLogoShape()
  }, [resetRing, resetLogoShape])

  const showToast = useCallback((text: string) => {
    setToast(text)
    setTimeout(() => setToast(null), 1600)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    // Capture real logo center position so disc fans from the actual logo on any screen size
    if (logoRef.current) {
      const rect = logoRef.current.getBoundingClientRect()
      logoCxRef.current = rect.left + rect.width / 2
      logoCyRef.current = rect.top + rect.height / 2
    }
    holdStartRef.current = performance.now()

    if (logoRef.current) {
      logoRef.current.style.borderRadius = '50%'
      logoRef.current.style.transform = 'scale(0.88)'
    }

    const animate = (now: number) => {
      const elapsed = now - holdStartRef.current
      const progress = Math.min(elapsed / HOLD_MS, 1)

      if (ringArcRef.current) {
        ringArcRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress))
      }

      if (progress < 1) {
        holdRafRef.current = requestAnimationFrame(animate)
      } else {
        holdRafRef.current = null
        openDisc()
      }
    }

    holdRafRef.current = requestAnimationFrame(animate)
  }, [openDisc])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!discOpenRef.current) return

    const px = e.clientX
    const py = e.clientY

    let nearest: number | null = null
    let nearestDist = 65 // threshold px

    LEVELS.forEach((_, i) => {
      const c = nodeCenter(logoCxRef.current, logoCyRef.current, i)
      const dist = Math.hypot(px - c.x, py - c.y)
      if (dist < nearestDist) {
        nearest = i
        nearestDist = dist
      }
    })

    setHoveredNode(nearest)
  }, [])

  const handlePointerUp = useCallback(async (e: React.PointerEvent) => {
    if (!discOpenRef.current) {
      cancelHold()
      return
    }

    const selected = hoveredNode
    if (selected === null) {
      closeDisc()
      return
    }

    // Flash animation: scale 1.22 → 1.42 → 1
    setFlashingNode(selected)
    await nodeControls[selected].start({ scale: 1.22, transition: { duration: 0.07 } })
    await nodeControls[selected].start({ scale: 1.42, transition: { duration: 0.1 } })
    await nodeControls[selected].start({ scale: 1, transition: { duration: 0.12 } })

    closeDisc()
    switchLevel(selected)
    showToast(LEVELS[selected].label)
  }, [hoveredNode, closeDisc, cancelHold, switchLevel, showToast, nodeControls])

  if (!mounted) {
    // SSR placeholder — same size, level 0 color
    return (
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: LEVELS[0].color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <UMark />
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ position: 'relative', width: 52, height: 52, margin: -8 }}>
        {/* Hold ring SVG */}
        <svg
          width="52" height="52" viewBox="0 0 52 52"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <circle cx="26" cy="26" r="17" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <circle
            ref={ringArcRef}
            cx="26" cy="26" r="17"
            fill="none" stroke="white" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            transform="rotate(-90 26 26)"
            style={{ transition: 'none' }}
          />
        </svg>

        {/* Logo mark */}
        <div
          ref={logoRef}
          className="logo-shimmer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={cancelHold}
          style={{
            position: 'absolute',
            top: 8, left: 8,
            width: 36, height: 36,
            borderRadius: 10,
            background: level.color,
            transition: 'background 0.4s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          <UMark />
        </div>
      </div>

      {/* Portal: backdrop + disc + nodes + toast */}
      {mounted && createPortal(
        <>
          <AnimatePresence>
            {discOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  onPointerUp={closeDisc}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 9998,
                    background: 'rgba(26,23,20,0.55)',
                  }}
                />

                {/* Quarter disc — anchored to logo top-left corner */}
                <motion.div
                  key="disc"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    position: 'fixed',
                    top: logoCyRef.current - 18,
                    left: logoCxRef.current - 18,
                    width: 200, height: 200,
                    transformOrigin: 'top left',
                    zIndex: 9999,
                    pointerEvents: 'none',
                  }}
                >
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <defs>
                      <radialGradient id="discGrad" cx="0%" cy="0%" r="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </radialGradient>
                    </defs>
                    <path d="M 0 0 L 190 0 A 190 190 0 0 1 0 190 Z" fill="url(#discGrad)" />
                    {[55, 110, 160].map(r => (
                      <circle key={r} cx="0" cy="0" r={r}
                        fill="none" stroke="rgba(255,255,255,0.08)"
                        strokeDasharray="4 6" strokeWidth="1" />
                    ))}
                  </svg>
                </motion.div>

                {/* Nodes */}
                {LEVELS.map((lv, i) => {
                  const c = nodeCenter(logoCxRef.current, logoCyRef.current, i)
                  const isHovered = hoveredNode === i
                  const isDimmed = hoveredNode !== null && !isHovered
                  const isCurrent = levelIndex === i
                  const isFlashing = flashingNode === i

                  return (
                    <motion.div
                      key={i}
                      animate={isFlashing ? nodeControls[i] : {
                        scale: isDimmed ? 0.84 : isHovered ? 1.22 : 1,
                        opacity: isDimmed ? 0.28 : 1,
                      }}
                      initial={{ scale: 0.15, opacity: 0 }}
                      exit={{ scale: 0.15, opacity: 0, transition: { duration: 0.15 } }}
                      transition={{
                        delay: isFlashing ? 0 : [0, 0.06, 0.12][i],
                        duration: 0.3,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      style={{
                        position: 'fixed',
                        left: c.x - 28,
                        top: c.y - 28,
                        width: 56, height: 56,
                        borderRadius: '50%',
                        background: lv.color,
                        zIndex: 10000,
                        border: `2.5px solid ${
                          isCurrent ? 'rgba(255,255,255,0.7)' :
                          isHovered ? 'rgba(255,255,255,0.9)' :
                          'rgba(255,255,255,0.2)'
                        }`,
                        boxShadow: isHovered
                          ? `0 4px 18px rgba(0,0,0,0.28), 0 0 0 6px ${lv.color}40`
                          : '0 4px 18px rgba(0,0,0,0.28)',
                        filter: isHovered ? 'brightness(1.12)' : 'none',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 1,
                        pointerEvents: 'none',
                      }}
                    >
                      <span style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13, fontWeight: 700,
                        color: 'white', lineHeight: 1,
                      }}>
                        {lv.short}
                      </span>
                      <span style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 7, opacity: 0.72,
                        letterSpacing: '0.03em',
                        color: 'white', lineHeight: 1,
                      }}>
                        {lv.label}
                      </span>
                    </motion.div>
                  )
                })}
              </>
            )}
          </AnimatePresence>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                key="toast"
                initial={{ opacity: 0, y: 8, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 8, x: '-50%' }}
                style={{
                  position: 'fixed', bottom: 90,
                  left: '50%',
                  background: level.color, color: 'white',
                  borderRadius: 20, padding: '6px 16px',
                  fontSize: 13, fontWeight: 600, zIndex: 99999,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}

function UMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path
        d="M14 14V30C14 34.4183 17.5817 38 22 38H26C30.4183 38 34 34.4183 34 30V14"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
