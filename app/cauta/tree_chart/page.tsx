'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '@/components/BottomNav'
import { SchoolGate } from '@/components/SchoolGate'
import { getSupabase } from '@/lib/supabase'
import { Loader2, ArrowLeft } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string
  name: string
  username: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  city: string | null
}

interface ClassNode {
  letter: string
  students: Student[]
  startAngle: number
  endAngle: number
  midAngle: number
}

interface YearNode {
  year: number
  classes: ClassNode[]
  startAngle: number
  endAngle: number
  midAngle: number
  colorIdx: number
}

// ─── Colour palette ───────────────────────────────────────────────────────────

const COLORS = [
  { fill: '#F59E0B', dark: '#92400E', light: '#FEF3C7' },
  { fill: '#10B981', dark: '#064E3B', light: '#D1FAE5' },
  { fill: '#3B82F6', dark: '#1E3A8A', light: '#DBEAFE' },
  { fill: '#8B5CF6', dark: '#4C1D95', light: '#EDE9FE' },
  { fill: '#EC4899', dark: '#831843', light: '#FCE7F3' },
  { fill: '#F97316', dark: '#7C2D12', light: '#FFEDD5' },
  { fill: '#06B6D4', dark: '#164E63', light: '#CFFAFE' },
]

// ─── SVG dimensions ───────────────────────────────────────────────────────────

const CX = 170
const CY = 170
const R_CENTER  = 45
const R_YEAR    = 100
const R_CLASS   = 152
const GAP_YEAR  = 0.035   // radians between year segments
const GAP_CLASS = 0.022   // radians between class segments

// ─── Arc path helper ──────────────────────────────────────────────────────────

function arcPath(
  rIn: number, rOut: number,
  a1: number, a2: number,
): string {
  if (Math.abs(a2 - a1) < 0.001) return ''
  const c1 = Math.cos(a1), s1 = Math.sin(a1)
  const c2 = Math.cos(a2), s2 = Math.sin(a2)
  const x1 = CX + rOut * c1, y1 = CY + rOut * s1
  const x2 = CX + rOut * c2, y2 = CY + rOut * s2
  const x3 = CX + rIn  * c2, y3 = CY + rIn  * s2
  const x4 = CX + rIn  * c1, y4 = CY + rIn  * s1
  const large = (a2 - a1) > Math.PI ? 1 : 0
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`
}

function labelPos(rIn: number, rOut: number, midAngle: number) {
  const r = (rIn + rOut) / 2
  return { x: CX + r * Math.cos(midAngle), y: CY + r * Math.sin(midAngle) }
}

// ─── Tree builder ─────────────────────────────────────────────────────────────

function buildTree(students: Student[]): YearNode[] {
  const total = students.length
  if (total === 0) return []

  // Group by year
  const byYear = new Map<number, Student[]>()
  for (const s of students) {
    if (!byYear.has(s.graduation_year)) byYear.set(s.graduation_year, [])
    byYear.get(s.graduation_year)!.push(s)
  }
  const sortedYears = [...byYear.keys()].sort((a, b) => b - a)
  const numYears = sortedYears.length

  const availableAngle = 2 * Math.PI - numYears * GAP_YEAR
  const nodes: YearNode[] = []
  let angle = -Math.PI / 2   // start from top

  sortedYears.forEach((year, idx) => {
    const yearStudents = byYear.get(year)!
    const yearAngle = (yearStudents.length / total) * availableAngle
    const yearStart = angle
    const yearEnd   = angle + yearAngle
    const yearMid   = (yearStart + yearEnd) / 2

    // Group by class (null → '?')
    const byClass = new Map<string, Student[]>()
    for (const s of yearStudents) {
      const key = s.class ?? '?'
      if (!byClass.has(key)) byClass.set(key, [])
      byClass.get(key)!.push(s)
    }
    const sortedClasses = [...byClass.keys()].sort()
    const numClasses = sortedClasses.length
    const availableClassAngle = yearAngle - numClasses * GAP_CLASS

    const classNodes: ClassNode[] = []
    let classAngle = yearStart

    sortedClasses.forEach(letter => {
      const classStudents = byClass.get(letter)!
      const classArcAngle = (classStudents.length / yearStudents.length) * availableClassAngle
      const classStart = classAngle
      const classEnd   = classAngle + classArcAngle
      const classMid   = (classStart + classEnd) / 2
      classNodes.push({ letter, students: classStudents, startAngle: classStart, endAngle: classEnd, midAngle: classMid })
      classAngle = classEnd + GAP_CLASS
    })

    nodes.push({ year, classes: classNodes, startAngle: yearStart, endAngle: yearEnd, midAngle: yearMid, colorIdx: idx % COLORS.length })
    angle = yearEnd + GAP_YEAR
  })

  return nodes
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TreeChartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) { router.push('/autentificare'); return }

      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('id, highschool')
        .eq('id', user.id)
        .single()

      if (!profile) { router.push('/autentificare'); return }

      const { data } = await getSupabase()
        .from('profiles')
        .select('id, name, username, graduation_year, class, profession, domain, city')
        .eq('highschool', profile.highschool)
        .eq('onboarding_completed', true)
        .neq('id', user.id)
        .is('archived_at', null)
        .not('graduation_year', 'is', null)

      setStudents((data as Student[]) ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const tree = useMemo(() => buildTree(students), [students])

  const selectedYearNode  = tree.find(y => y.year === selectedYear) ?? null
  const selectedClassNode = selectedYearNode?.classes.find(c => c.letter === selectedClass) ?? null

  function handleYearClick(year: number) {
    if (selectedYear === year) { setSelectedYear(null); setSelectedClass(null) }
    else { setSelectedYear(year); setSelectedClass(null) }
  }

  function handleClassClick(year: number, letter: string) {
    setSelectedYear(year)
    if (selectedYear === year && selectedClass === letter) setSelectedClass(null)
    else setSelectedClass(letter)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  return (
    <SchoolGate>
      <main className="min-h-screen pb-24" style={{ background: 'var(--cream2)' }}>
        <div className="mx-auto max-w-sm px-6 py-6 space-y-4">

          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: 'var(--ink2)' }}
            >
              <ArrowLeft size={16} />
              Înapoi
            </button>
            <span className="font-display text-lg" style={{ color: 'var(--ink)' }}>Arbore de promoție</span>
          </div>

          {/* Sunburst */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--white)' }}>
            {students.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--ink3)' }}>
                Niciun coleg găsit.
              </div>
            ) : (
              <svg viewBox="0 0 340 340" width="100%" style={{ display: 'block' }}>
                {tree.map(yn => {
                  const col = COLORS[yn.colorIdx]
                  const yearDimmed = selectedYear !== null && selectedYear !== yn.year
                  const yearOpacity = yearDimmed ? 0.2 : 1

                  return (
                    <g key={yn.year}>
                      {/* Year arc */}
                      <path
                        d={arcPath(R_CENTER, R_YEAR, yn.startAngle, yn.endAngle)}
                        fill={col.fill}
                        style={{ opacity: yearOpacity, cursor: 'pointer', transition: 'opacity 0.25s' }}
                        onClick={() => handleYearClick(yn.year)}
                      />

                      {/* Year label */}
                      {(yn.endAngle - yn.startAngle) > 0.22 && (() => {
                        const p = labelPos(R_CENTER, R_YEAR, yn.midAngle)
                        return (
                          <text
                            x={p.x} y={p.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize="10" fontWeight="700" fill="white"
                            style={{ opacity: yearOpacity, pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.25s' }}
                          >
                            {yn.year}
                          </text>
                        )
                      })()}

                      {/* Class arcs */}
                      {yn.classes.map(cn => {
                        const isActive = selectedYear === yn.year && selectedClass === cn.letter
                        const classDimmed = selectedYear === yn.year && selectedClass !== null && !isActive
                        const classOpacity = yearDimmed ? 0.2 : classDimmed ? 0.3 : 1

                        return (
                          <g key={cn.letter}>
                            <path
                              d={arcPath(R_YEAR, R_CLASS, cn.startAngle, cn.endAngle)}
                              fill={isActive ? col.dark : col.light}
                              stroke={col.fill}
                              strokeWidth={isActive ? 1.5 : 0.5}
                              style={{ opacity: classOpacity, cursor: 'pointer', transition: 'opacity 0.25s, fill 0.15s' }}
                              onClick={() => handleClassClick(yn.year, cn.letter)}
                            />
                            {(cn.endAngle - cn.startAngle) > 0.17 && (() => {
                              const p = labelPos(R_YEAR, R_CLASS, cn.midAngle)
                              return (
                                <text
                                  x={p.x} y={p.y}
                                  textAnchor="middle" dominantBaseline="middle"
                                  fontSize="9" fontWeight="600"
                                  fill={isActive ? 'white' : col.dark}
                                  style={{ opacity: classOpacity, pointerEvents: 'none', userSelect: 'none', transition: 'opacity 0.25s' }}
                                >
                                  {cn.letter}
                                </text>
                              )
                            })()}
                          </g>
                        )
                      })}
                    </g>
                  )
                })}

                {/* Centre circle */}
                <circle
                  cx={CX} cy={CY} r={R_CENTER}
                  fill="white" stroke="#e5e7eb" strokeWidth="1"
                  style={{ cursor: selectedYear ? 'pointer' : 'default' }}
                  onClick={() => { setSelectedYear(null); setSelectedClass(null) }}
                />
                <text x={CX} y={CY - 7} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="#1f2937" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {students.length}
                </text>
                <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#9ca3af" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  colegi
                </text>
              </svg>
            )}
          </div>

          {/* Hint */}
          {!selectedYear && students.length > 0 && (
            <p className="text-center text-xs" style={{ color: 'var(--ink3)' }}>
              Apasă pe o promoție · apoi pe o clasă
            </p>
          )}

          {/* Info panel */}
          <AnimatePresence mode="wait">
            {selectedClassNode && (
              <motion.div
                key={`class-${selectedYear}-${selectedClass}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                    Clasa {selectedClass} · Promoția {selectedYear}
                  </span>
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}>
                    {selectedClassNode.students.length}
                  </span>
                </div>
                {selectedClassNode.students.map(s => (
                  <Link
                    key={s.id}
                    href={`/profil/${s.username}`}
                    className="block rounded-xl px-4 py-3"
                    style={{ border: '1px solid var(--border)', background: 'var(--white)' }}
                  >
                    <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{s.name}</div>
                    {s.city && <div className="mt-0.5 text-xs" style={{ color: 'var(--ink3)' }}>{s.city}</div>}
                    {(s.profession?.length > 0 || s.domain?.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.profession?.slice(0, 2).map(p => (
                          <span key={p} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}>{p}</span>
                        ))}
                        {s.domain?.slice(0, 2).map(d => (
                          <span key={d} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--teal-soft)', color: 'var(--teal-dark)' }}>{d}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </motion.div>
            )}

            {selectedYearNode && !selectedClassNode && (
              <motion.div
                key={`year-${selectedYear}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-2"
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Promoția {selectedYear} &middot; {selectedYearNode.classes.reduce((s, c) => s + c.students.length, 0)} colegi
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedYearNode.classes.map(c => (
                    <button
                      key={c.letter}
                      type="button"
                      onClick={() => handleClassClick(selectedYear!, c.letter)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink2)' }}
                    >
                      Clasa {c.letter}
                      <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}>
                        {c.students.length}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        <BottomNav />
      </main>
    </SchoolGate>
  )
}
