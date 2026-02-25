'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Clock, Users } from 'lucide-react'
import { QuizOverlay } from '@/components/sondaje/QuizOverlay'
import { QuizCreateDialog } from '@/components/sondaje/QuizCreateDialog'

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
  description: string | null
  target_scope: string
  active: boolean
  expires_at: string | null
  created_at: string
  questions: QuizQuestion[]
  completed: boolean
  response_count: number
}

interface Profile {
  role: string
  highschool?: string
  graduation_year?: number
  class?: string
}

export default function SondajePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [overlayMode, setOverlayMode] = useState<'take' | 'results'>('take')
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const res = await fetch('/api/sondaje')
    if (res.ok) {
      const data = await res.json()
      setQuizzes(data.quizzes || [])
      setProfile(data.profile || null)
    }
    setLoading(false)
  }

  function openTake(quiz: Quiz) {
    setActiveQuiz(quiz)
    setOverlayMode('take')
  }

  function openResults(quiz: Quiz) {
    setActiveQuiz(quiz)
    setOverlayMode('results')
  }

  function closeOverlay() {
    setActiveQuiz(null)
  }

  function onQuizCompleted() {
    if (activeQuiz) {
      setQuizzes(prev =>
        prev.map(q =>
          q.id === activeQuiz.id
            ? { ...q, completed: true, response_count: q.response_count + 1 }
            : q
        )
      )
    }
  }

  function formatExpiry(expiresAt: string) {
    const diff = new Date(expiresAt).getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    if (days <= 0) return 'Expirat'
    if (days === 1) return 'Expiră mâine'
    return `Expiră în ${days} zile`
  }

  const isAdminOrMod = profile?.role === 'admin' || profile?.role === 'moderator'

  return (
    <>
      <div className="min-h-screen pb-24">
        <div className="max-w-sm mx-auto px-6 py-6">
          {isAdminOrMod && (
            <div className="mb-6">
              <button
                onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors justify-center"
              >
                <Plus className="w-4 h-4" />
                Creează sondaj
              </button>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && quizzes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-lg font-semibold text-gray-800">Niciun sondaj activ momentan</h2>
              <p className="text-sm text-gray-500 mt-1">Revino mai târziu!</p>
            </div>
          )}

          {!loading && quizzes.length > 0 && (
            <div className="space-y-3">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      {quiz.description && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{quiz.description}</p>
                      )}
                    </div>
                    {quiz.completed && (
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      {quiz.response_count} {quiz.response_count === 1 ? 'răspuns' : 'răspunsuri'}
                    </span>
                    {quiz.expires_at && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatExpiry(quiz.expires_at)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {quiz.completed ? (
                      <button
                        onClick={() => openResults(quiz)}
                        className="w-full py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
                      >
                        Vezi rezultate
                      </button>
                    ) : (
                      <button
                        onClick={() => openTake(quiz)}
                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Începe
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeQuiz && (
        <QuizOverlay
          quiz={activeQuiz}
          mode={overlayMode}
          onClose={closeOverlay}
          onCompleted={onQuizCompleted}
        />
      )}

      {isAdminOrMod && profile && (
        <QuizCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          userProfile={{
            highschool: profile.highschool,
            graduation_year: profile.graduation_year,
            class: profile.class,
          }}
          onCreated={loadData}
        />
      )}
    </>
  )
}
