'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'

interface QuizOption {
  id: string
  option_text: string
  order_index: number
}

interface QuizQuestion {
  id: string
  question_text: string
  order_index: number
  quiz_options: QuizOption[]
}

interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
  completed: boolean
}

interface StatsOption {
  id: string
  option_text: string
  count: number
  percentage: number
}

interface StatsQuestion {
  id: string
  question_text: string
  options: StatsOption[]
}

interface Stats {
  questions: StatsQuestion[]
  user_answers: Record<string, string> | null
}

interface UnlockData {
  unlocked: boolean
  response_count: number
  reveal_threshold: number
}

interface Props {
  quiz: Quiz
  mode: 'take' | 'results' | 'peek'
  onClose: () => void
  onCompleted: (unlockData: UnlockData) => void
  onPeeked?: () => void
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface PieSlice {
  percentage: number
  color: string
  highlighted: boolean
}

function PieChart({ slices, onClick, size = 140 }: { slices: PieSlice[]; onClick?: () => void; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4

  let cumulative = 0
  const paths: { d: string; color: string; highlighted: boolean }[] = []

  for (const slice of slices) {
    if (slice.percentage <= 0) { cumulative += slice.percentage; continue }
    const startAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2
    const endAngle = ((cumulative + slice.percentage) / 100) * 2 * Math.PI - Math.PI / 2
    const largeArc = slice.percentage > 50 ? 1 : 0

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
    paths.push({ d, color: slice.color, highlighted: slice.highlighted })
    cumulative += slice.percentage
  }

  // Handle 100% single slice
  if (slices.length === 1 || (slices.filter(s => s.percentage > 0).length === 1 && slices.find(s => s.percentage === 100))) {
    const single = slices.find(s => s.percentage === 100)
    if (single) {
      return (
        <svg
          width={size}
          height={size}
          onClick={onClick}
          className={onClick ? 'cursor-pointer' : ''}
        >
          <circle cx={cx} cy={cy} r={r} fill={single.color} opacity={single.highlighted ? 1 : 0.7} />
        </svg>
      )
    }
  }

  return (
    <svg
      width={size}
      height={size}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.color}
          opacity={p.highlighted ? 1 : 0.65}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

export function QuizOverlay({ quiz, mode, onClose, onCompleted, onPeeked }: Props) {
  const [phase, setPhase] = useState<'taking' | 'submitting' | 'results' | 'loading-results'>(
    mode === 'results' || mode === 'peek' ? 'loading-results' : 'taking'
  )
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [zoomedQuestion, setZoomedQuestion] = useState<number | null>(null)
  const [peekError, setPeekError] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'results') fetchStats()
    if (mode === 'peek') fetchPeek()
  }, [])

  async function fetchStats() {
    const res = await fetch(`/api/sondaje/${quiz.id}/statistici`)
    if (res.ok) {
      const data = await res.json()
      setStats(data)
      setPhase('results')
    }
  }

  async function fetchPeek() {
    const res = await fetch(`/api/sondaje/${quiz.id}/peek`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      onPeeked?.()
      setStats(data)
      setPhase('results')
    } else {
      const data = await res.json().catch(() => ({}))
      setPeekError(data.error || 'Nu s-au putut încărca rezultatele.')
    }
  }

  function selectOption(questionId: string, optionId: string) {
    if (selectedOption) return
    setSelectedOption(optionId)

    setTimeout(() => {
      const newAnswers = { ...localAnswers, [questionId]: optionId }
      setLocalAnswers(newAnswers)
      setSelectedOption(null)

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
      } else {
        submitAnswers(newAnswers)
      }
    }, 400)
  }

  async function submitAnswers(finalAnswers: Record<string, string>) {
    setPhase('submitting')
    const res = await fetch(`/api/sondaje/${quiz.id}/raspuns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: finalAnswers }),
    })
    if (res.ok) {
      const data = await res.json()
      const unlockData: UnlockData = {
        unlocked: data.unlocked,
        response_count: data.response_count,
        reveal_threshold: data.reveal_threshold,
      }
      onCompleted(unlockData)
      if (data.unlocked) {
        await fetchStats()
      } else {
        onClose()
      }
    }
  }

  const questions = quiz.questions

  // — Loading results / peek error
  if (phase === 'loading-results') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        {peekError ? (
          <div className="text-center px-8">
            <p className="text-gray-700 text-sm font-medium mb-1">Eroare la încărcare</p>
            <p className="text-gray-400 text-xs mb-5">{peekError}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Închide
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm">Se încarcă rezultatele...</p>
          </div>
        )}
      </div>
    )
  }

  // — Submitting answers
  if (phase === 'submitting') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Se salvează răspunsurile...</p>
        </div>
      </div>
    )
  }

  // — Results: single scrollable page with all pie charts
  if (phase === 'results' && stats) {
    const userAnswers = stats.user_answers || localAnswers

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Rezultatele sondajului</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-8">
          {stats.questions.map((q, qi) => {
            const slices: PieSlice[] = q.options.map((opt, oi) => ({
              percentage: opt.percentage,
              color: COLORS[oi % COLORS.length],
              highlighted: opt.id === userAnswers[q.id],
            }))

            return (
              <div key={q.id}>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  {qi + 1}. {q.question_text}
                </p>

                <div className="flex justify-center mb-4">
                  <PieChart
                    slices={slices}
                    onClick={() => setZoomedQuestion(qi)}
                  />
                </div>

                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isChosen = opt.id === userAnswers[q.id]
                    return (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: COLORS[oi % COLORS.length] }}
                        />
                        <span className={`text-xs flex-1 ${isChosen ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {opt.option_text}
                          {isChosen && ' ✓'}
                        </span>
                        <span className="text-xs text-gray-500 tabular-nums">{opt.percentage}%</span>
                      </div>
                    )
                  })}
                </div>

                {qi < stats.questions.length - 1 && (
                  <div className="mt-6 border-t border-gray-100" />
                )}
              </div>
            )
          })}
        </div>

        {/* Zoomed view */}
        {zoomedQuestion !== null && (() => {
          const q = stats.questions[zoomedQuestion]
          const slices: PieSlice[] = q.options.map((opt, oi) => ({
            percentage: opt.percentage,
            color: COLORS[oi % COLORS.length],
            highlighted: opt.id === userAnswers[q.id],
          }))
          return (
            <div className="fixed inset-0 z-60 bg-white flex flex-col">
              <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
                <button
                  onClick={() => setZoomedQuestion(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <p className="text-sm font-semibold text-gray-800 flex-1 line-clamp-2">
                  {zoomedQuestion + 1}. {q.question_text}
                </p>
                <button
                  onClick={() => setZoomedQuestion(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
                <PieChart slices={slices} size={260} />

                <div className="w-full max-w-xs space-y-2">
                  {q.options.map((opt, oi) => {
                    const isChosen = opt.id === userAnswers[q.id]
                    return (
                      <div key={opt.id} className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded shrink-0"
                          style={{ backgroundColor: COLORS[oi % COLORS.length] }}
                        />
                        <span className={`text-sm flex-1 ${isChosen ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {opt.option_text}
                          {isChosen && ' ✓'}
                        </span>
                        <span className="text-sm font-semibold text-gray-700 tabular-nums">{opt.percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  // — Quiz taking
  const question = questions[currentQuestion]

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Progress bar */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {questions.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-700 transition-all duration-300"
              style={{ width: i < currentQuestion ? '100%' : i === currentQuestion ? '40%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onClose}
        className="absolute top-3 right-4 p-2 rounded-full hover:bg-gray-100"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{question.question_text}</h2>

          <div className="space-y-3">
            {question.quiz_options.map((opt) => {
              const isSelected = selectedOption === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(question.id, opt.id)}
                  disabled={!!selectedOption}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.option_text}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <p className="text-center text-xs text-gray-400">
          Întrebarea {currentQuestion + 1} din {questions.length}
        </p>
      </div>
    </div>
  )
}
