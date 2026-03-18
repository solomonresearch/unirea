'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { BottomNav } from '@/components/BottomNav'
import { SchoolGate } from '@/components/SchoolGate'
import { getSupabase } from '@/lib/supabase'
import { Loader2, ChevronRight, ArrowLeft, Network } from 'lucide-react'

interface YearEntry {
  year: number
  count: number
}

interface ClassEntry {
  letter: string
  count: number
}

interface ProfileResult {
  id: string
  name: string
  username: string
  graduation_year: number
  class: string | null
  profession: string[]
  domain: string[]
  company: string | null
  city: string | null
  country: string | null
}

type Layer = 'years' | 'classes' | 'classmates'

const variants = {
  enter: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? 60 : -60,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 'forward' | 'back') => ({
    x: direction === 'forward' ? -60 : 60,
    opacity: 0,
  }),
}

const transition = { type: 'spring' as const, stiffness: 300, damping: 30 }

export default function TreeChartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [highschool, setHighschool] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [layer, setLayer] = useState<Layer>('years')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const [years, setYears] = useState<YearEntry[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [classes, setClasses] = useState<ClassEntry[]>([])
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [classmates, setClassmates] = useState<ProfileResult[]>([])
  const [layerLoading, setLayerLoading] = useState(false)

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

      setCurrentUserId(profile.id)
      setHighschool(profile.highschool)

      // Fetch years
      const { data } = await getSupabase()
        .from('profiles')
        .select('graduation_year')
        .eq('highschool', profile.highschool)
        .eq('onboarding_completed', true)
        .neq('id', user.id)
        .is('archived_at', null)
        .not('graduation_year', 'is', null)

      if (data) {
        const counts: Record<number, number> = {}
        for (const row of data) {
          if (row.graduation_year) {
            counts[row.graduation_year] = (counts[row.graduation_year] ?? 0) + 1
          }
        }
        const sorted = Object.entries(counts)
          .map(([y, c]) => ({ year: Number(y), count: c }))
          .sort((a, b) => b.year - a.year)
        setYears(sorted)
      }

      setLoading(false)
    }
    init()
  }, [router])

  async function selectYear(year: number) {
    setLayerLoading(true)
    setSelectedYear(year)

    const { data } = await getSupabase()
      .from('profiles')
      .select('class')
      .eq('highschool', highschool)
      .eq('graduation_year', year)
      .eq('onboarding_completed', true)
      .neq('id', currentUserId)
      .is('archived_at', null)
      .not('class', 'is', null)

    if (data) {
      const counts: Record<string, number> = {}
      for (const row of data) {
        if (row.class) {
          counts[row.class] = (counts[row.class] ?? 0) + 1
        }
      }
      const sorted = Object.entries(counts)
        .map(([letter, count]) => ({ letter, count }))
        .sort((a, b) => a.letter.localeCompare(b.letter))
      setClasses(sorted)
    }

    setDirection('forward')
    setLayer('classes')
    setLayerLoading(false)
  }

  async function selectClass(letter: string) {
    setLayerLoading(true)
    setSelectedClass(letter)

    const { data } = await getSupabase()
      .from('profiles')
      .select('id, name, username, graduation_year, class, profession, domain, company, city, country')
      .eq('highschool', highschool)
      .eq('graduation_year', selectedYear)
      .eq('class', letter)
      .eq('onboarding_completed', true)
      .neq('id', currentUserId)
      .is('archived_at', null)
      .order('name')

    setClassmates((data as ProfileResult[]) ?? [])
    setDirection('forward')
    setLayer('classmates')
    setLayerLoading(false)
  }

  function goBack() {
    setDirection('back')
    if (layer === 'classmates') {
      setLayer('classes')
      setSelectedClass(null)
    } else if (layer === 'classes') {
      setLayer('years')
      setSelectedYear(null)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center" style={{ background: 'var(--cream2)' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </main>
    )
  }

  const breadcrumb = selectedYear
    ? selectedClass
      ? `${selectedYear} → ${selectedClass}`
      : `${selectedYear}`
    : null

  return (
    <SchoolGate>
      <main className="min-h-screen pb-24" style={{ background: 'var(--cream2)' }}>
        <div className="mx-auto max-w-sm px-6 py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            {layer !== 'years' ? (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--ink2)' }}
              >
                <ArrowLeft size={16} />
                Înapoi
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: 'var(--ink2)' }}
              >
                <ArrowLeft size={16} />
                Înapoi
              </button>
            )}
            <span className="flex items-center gap-1.5 font-display text-lg" style={{ color: 'var(--ink)' }}>
              <Network size={18} style={{ color: 'var(--ink3)' }} />
              Arbore de promoție
            </span>
          </div>

          {/* Breadcrumb */}
          {breadcrumb && (
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--ink3)' }}>
              {selectedYear && (
                <button
                  type="button"
                  onClick={() => { setDirection('back'); setLayer('years'); setSelectedYear(null); setSelectedClass(null) }}
                  className="hover:underline"
                  style={{ color: 'var(--amber-dark)' }}
                >
                  {selectedYear}
                </button>
              )}
              {selectedClass && (
                <>
                  <ChevronRight size={12} />
                  <span style={{ color: 'var(--ink2)' }}>Clasa {selectedClass}</span>
                </>
              )}
            </div>
          )}

          {/* Panel area */}
          <div className="overflow-hidden relative">
            {layerLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={22} className="animate-spin" style={{ color: 'var(--ink3)' }} />
              </div>
            ) : (
              <AnimatePresence mode="wait" custom={direction}>
                {layer === 'years' && (
                  <motion.div
                    key="years"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                  >
                    <p className="mb-3 text-sm" style={{ color: 'var(--ink3)' }}>Selectează promoția:</p>
                    <div className="flex flex-wrap gap-2">
                      {years.map(({ year, count }) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => selectYear(year)}
                          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                          style={{ border: '1px solid var(--border)', background: 'var(--white)', color: 'var(--ink2)' }}
                          onMouseEnter={e => {
                            const el = e.currentTarget
                            el.style.background = 'var(--amber-soft)'
                            el.style.color = 'var(--amber-dark)'
                            el.style.borderColor = 'var(--amber-dark)'
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget
                            el.style.background = 'var(--white)'
                            el.style.color = 'var(--ink2)'
                            el.style.borderColor = 'var(--border)'
                          }}
                        >
                          {year}
                          <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}>
                            {count}
                          </span>
                        </button>
                      ))}
                      {years.length === 0 && (
                        <p className="text-sm" style={{ color: 'var(--ink3)' }}>Nicio promoție găsită.</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {layer === 'classes' && (
                  <motion.div
                    key="classes"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                  >
                    <p className="mb-3 text-sm" style={{ color: 'var(--ink3)' }}>Selectează clasa:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {classes.map(({ letter, count }) => (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => selectClass(letter)}
                          className="rounded-xl py-4 text-center transition-colors"
                          style={{ border: '1px solid var(--border)', background: 'var(--white)' }}
                          onMouseEnter={e => {
                            const el = e.currentTarget
                            el.style.background = 'var(--amber-soft)'
                            el.style.borderColor = 'var(--amber-dark)'
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget
                            el.style.background = 'var(--white)'
                            el.style.borderColor = 'var(--border)'
                          }}
                        >
                          <div className="text-2xl font-display" style={{ color: 'var(--ink)' }}>{letter}</div>
                          <div className="mt-0.5 text-xs" style={{ color: 'var(--ink3)' }}>clasa · {count}</div>
                        </button>
                      ))}
                      {classes.length === 0 && (
                        <p className="col-span-3 text-sm" style={{ color: 'var(--ink3)' }}>Nicio clasă găsită.</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {layer === 'classmates' && (
                  <motion.div
                    key="classmates"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transition}
                  >
                    <p className="mb-3 text-sm" style={{ color: 'var(--ink3)' }}>Colegi din clasa {selectedClass}:</p>
                    <div className="space-y-2">
                      {classmates.map(profile => (
                        <Link
                          key={profile.id}
                          href={`/profil/${profile.username}`}
                          className="block rounded-xl px-4 py-3 transition-colors"
                          style={{ border: '1px solid var(--border)', background: 'var(--white)' }}
                        >
                          <div className="font-medium text-sm" style={{ color: 'var(--ink)' }}>{profile.name}</div>
                          <div className="mt-0.5 text-xs" style={{ color: 'var(--ink3)' }}>
                            Promoția {profile.graduation_year}
                            {profile.city ? ` · ${profile.city}` : ''}
                          </div>
                          {(profile.profession?.length > 0 || profile.domain?.length > 0) && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {profile.profession?.slice(0, 2).map(p => (
                                <span key={p} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)' }}>{p}</span>
                              ))}
                              {profile.domain?.slice(0, 2).map(d => (
                                <span key={d} className="rounded-full px-2 py-0.5 text-xs" style={{ background: 'var(--teal-soft)', color: 'var(--teal-dark)' }}>{d}</span>
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                      {classmates.length === 0 && (
                        <p className="text-sm" style={{ color: 'var(--ink3)' }}>Nicio persoană în această clasă.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
        <BottomNav />
      </main>
    </SchoolGate>
  )
}
