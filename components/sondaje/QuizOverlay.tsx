'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface QuizOption {
  id: string
  option_text: string
  emoji: string | null
  order_index: number
}

interface QuizQuestion {
  id: string
  question_text: string
  emoji: string | null
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
  emoji: string | null
  count: number
  percentage: number
}

interface StatsQuestion {
  id: string
  question_text: string
  emoji: string | null
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
}

export function QuizOverlay({ quiz, mode, onClose, onCompleted }: Props) {
  const [phase, setPhase] = useState<'taking' | 'submitting' | 'results' | 'loading-results'>(
    mode === 'results' || mode === 'peek' ? 'loading-results' : 'taking'
  )
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [barsAnimated, setBarsAnimated] = useState(false)

  useEffect(() => {
    if (mode === 'results') fetchStats()
    if (mode === 'peek') fetchPeek()
  }, [])

  // Trigger bar animation whenever the slide changes
  useEffect(() => {
    if (phase === 'results') {
      setBarsAnimated(false)
      const t = setTimeout(() => setBarsAnimated(true), 50)
      return () => clearTimeout(t)
    }
  }, [currentSlide, phase])

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
      setStats(data)
      setPhase('results')
    } else {
      onClose()
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
        setCurrentSlide(0)
      } else {
        onClose()
      }
    }
  }

  function nextSlide() {
    if (!stats) return
    if (currentSlide < stats.questions.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const questions = quiz.questions

  // — Loading results
  if (phase === 'loading-results') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500 text-sm">Se încarcă rezultatele...</p>
        </div>
      </div>
    )
  }

  // — Submitting answers
  if (phase === 'submitting') {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500 text-sm">Se salvează răspunsurile...</p>
        </div>
      </div>
    )
  }

  // — Results slides
  if (phase === 'results' && stats) {
    const slide = stats.questions[currentSlide]
    const userAnswers = stats.user_answers || localAnswers
    const isLastSlide = currentSlide === stats.questions.length - 1

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Progress */}
        <div className="flex gap-1 px-4 pt-4 pb-2">
          {stats.questions.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  i <= currentSlide ? 'bg-blue-600' : ''
                }`}
                style={{ width: i <= currentSlide ? '100%' : '0%' }}
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

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-sm mx-auto">
            {slide.emoji && (
              <div className="text-5xl text-center mb-4">{slide.emoji}</div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{slide.question_text}</h2>

            <div className="space-y-3">
              {slide.options.map((opt) => {
                const isChosen = opt.id === userAnswers[slide.id]
                return (
                  <div
                    key={opt.id}
                    className={`rounded-xl p-3 border-2 ${
                      isChosen
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isChosen ? 'text-blue-700' : 'text-gray-700'}`}>
                        {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
                        {opt.option_text}
                      </span>
                      <span className={`text-sm font-semibold tabular-nums ${isChosen ? 'text-blue-700' : 'text-gray-500'}`}>
                        {opt.percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isChosen ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                        style={{ width: barsAnimated ? `${opt.percentage}%` : '0%' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 pt-4 border-t border-gray-100">
          <div className="max-w-sm mx-auto">
            <button
              onClick={nextSlide}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              {isLastSlide ? 'Gata' : 'Următorul'}
            </button>
          </div>
        </div>
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
          {question.emoji && (
            <div className="text-6xl text-center mb-6">{question.emoji}</div>
          )}
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
                  {opt.emoji && <span className="mr-2">{opt.emoji}</span>}
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
