'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OptionData {
  option_text: string
  emoji: string
}

interface QuestionData {
  question_text: string
  emoji: string
  options: OptionData[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userProfile: { highschool?: string; graduation_year?: number; class?: string }
  onCreated: () => void
}

function emptyQuestion(): QuestionData {
  return {
    question_text: '',
    emoji: '',
    options: [
      { option_text: '', emoji: '' },
      { option_text: '', emoji: '' },
      { option_text: '', emoji: '' },
      { option_text: '', emoji: '' },
    ],
  }
}

export function QuizCreateDialog({ open, onOpenChange, userProfile, onCreated }: Props) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0 — details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetScope, setTargetScope] = useState<'all' | 'school' | 'year' | 'class'>('all')
  const [targetHighschool, setTargetHighschool] = useState(userProfile.highschool || '')
  const [targetYear, setTargetYear] = useState(userProfile.graduation_year?.toString() || '')
  const [targetClass, setTargetClass] = useState(userProfile.class || '')
  const [expiresAt, setExpiresAt] = useState('')
  const [active, setActive] = useState(true)
  const [revealThreshold, setRevealThreshold] = useState(10)
  const [anonymousMode, setAnonymousMode] = useState(false)

  // Steps 1–4 — questions
  const [questions, setQuestions] = useState<QuestionData[]>([
    emptyQuestion(),
    emptyQuestion(),
    emptyQuestion(),
    emptyQuestion(),
  ])

  function updateQuestion(qi: number, field: 'question_text' | 'emoji', value: string) {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q))
  }

  function updateOption(qi: number, oi: number, field: 'option_text' | 'emoji', value: string) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qi) return q
        return { ...q, options: q.options.map((o, j) => j === oi ? { ...o, [field]: value } : o) }
      })
    )
  }

  function canAdvance() {
    if (step === 0) return !!title.trim()
    if (step >= 1 && step <= 4) {
      const q = questions[step - 1]
      return !!q.question_text.trim() && q.options.every(o => !!o.option_text.trim())
    }
    return true
  }

  function reset() {
    setStep(0)
    setTitle('')
    setDescription('')
    setTargetScope('all')
    setTargetHighschool(userProfile.highschool || '')
    setTargetYear(userProfile.graduation_year?.toString() || '')
    setTargetClass(userProfile.class || '')
    setExpiresAt('')
    setActive(true)
    setRevealThreshold(10)
    setAnonymousMode(false)
    setQuestions([emptyQuestion(), emptyQuestion(), emptyQuestion(), emptyQuestion()])
    setError('')
  }

  async function publish() {
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        target_scope: targetScope,
        target_highschool: ['school', 'year', 'class'].includes(targetScope) ? targetHighschool : undefined,
        target_year: ['year', 'class'].includes(targetScope) ? parseInt(targetYear) : undefined,
        target_class: targetScope === 'class' ? targetClass : undefined,
        expires_at: expiresAt || undefined,
        active,
        reveal_threshold: revealThreshold,
        anonymous_mode: anonymousMode,
        questions: questions.map((q, qi) => ({
          question_text: q.question_text.trim(),
          emoji: q.emoji.trim() || undefined,
          order_index: qi,
          options: q.options.map((o, oi) => ({
            option_text: o.option_text.trim(),
            emoji: o.emoji.trim() || undefined,
            order_index: oi,
          })),
        })),
      }

      const res = await fetch('/api/sondaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la publicare')
      }

      onCreated()
      onOpenChange(false)
      reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 0 && 'Detalii sondaj'}
            {step >= 1 && step <= 4 && `Întrebarea ${step} din 4`}
            {step === 5 && 'Previzualizare'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 0 — details */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titlul sondajului *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Ce tip de elev ești?"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriere (opțional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Scurtă descriere..."
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vizibilitate</label>
              <select
                value={targetScope}
                onChange={e => setTargetScope(e.target.value as any)}
                className={inputCls}
              >
                <option value="all">Toți utilizatorii</option>
                <option value="school">Aceeași școală</option>
                <option value="year">Aceeași promoție</option>
                <option value="class">Aceeași clasă</option>
              </select>
            </div>
            {['school', 'year', 'class'].includes(targetScope) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Școală</label>
                <input
                  type="text"
                  value={targetHighschool}
                  onChange={e => setTargetHighschool(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            {['year', 'class'].includes(targetScope) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">An absolviție</label>
                <input
                  type="number"
                  value={targetYear}
                  onChange={e => setTargetYear(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            {targetScope === 'class' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clasă</label>
                <input
                  type="text"
                  value={targetClass}
                  onChange={e => setTargetClass(e.target.value)}
                  placeholder="Ex: 11A"
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiră la (opțional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deblochează rezultatele după
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={100}
                  value={revealThreshold}
                  onChange={e => setRevealThreshold(Math.min(100, Math.max(2, parseInt(e.target.value) || 2)))}
                  className={`${inputCls} w-24`}
                />
                <span className="text-sm text-gray-500">răspunsuri necesare</span>
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymousMode}
                onChange={e => setAnonymousMode(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Răspunsuri anonime</span>
                <p className="text-xs text-gray-400 mt-0.5">Participanții nu vor fi identificați în rezultate</p>
              </div>
            </label>
          </div>
        )}

        {/* Steps 1–4 — questions */}
        {step >= 1 && step <= 4 && (() => {
          const qi = step - 1
          const q = questions[qi]
          return (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Textul întrebării *</label>
                  <input
                    type="text"
                    value={q.question_text}
                    onChange={e => updateQuestion(qi, 'question_text', e.target.value)}
                    placeholder="Ex: Care e supraputerea ta?"
                    className={inputCls}
                  />
                </div>
                <div className="w-16">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={q.emoji}
                    onChange={e => updateQuestion(qi, 'emoji', e.target.value)}
                    placeholder="✨"
                    className={`${inputCls} text-center`}
                  />
                </div>
              </div>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opțiunea {oi + 1} *</label>
                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={e => updateOption(qi, oi, 'option_text', e.target.value)}
                      placeholder={`Opțiunea ${oi + 1}`}
                      className={inputCls}
                    />
                  </div>
                  <div className="w-16">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                    <input
                      type="text"
                      value={opt.emoji}
                      onChange={e => updateOption(qi, oi, 'emoji', e.target.value)}
                      placeholder="🎯"
                      className={`${inputCls} text-center`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Step 5 — preview */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Se deblochează după {revealThreshold} răspunsuri
                {anonymousMode && ' · Răspunsuri anonime'}
              </p>
            </div>
            {questions.map((q, qi) => (
              <div key={qi} className="border border-gray-200 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-800">
                  {q.emoji && <span className="mr-1.5">{q.emoji}</span>}
                  {qi + 1}. {q.question_text}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.map((opt, oi) => (
                    <p key={oi} className="text-xs text-gray-500 pl-3">
                      {opt.emoji && <span className="mr-1">{opt.emoji}</span>}
                      {opt.option_text}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700">Activ imediat</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Înapoi
            </button>
          )}
          {step < 5 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continuă
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={publish}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {loading ? 'Se publică...' : 'Publică sondajul'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
