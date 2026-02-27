'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'

interface OptionData {
  option_text: string
}

interface QuestionData {
  question_text: string
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
    options: [
      { option_text: '' },
      { option_text: '' },
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
  const [targetScope, setTargetScope] = useState<'school' | 'year' | 'class'>('school')
  const [targetHighschool, setTargetHighschool] = useState(userProfile.highschool || '')
  const [targetYear, setTargetYear] = useState(userProfile.graduation_year?.toString() || '')
  const [targetClass, setTargetClass] = useState(userProfile.class || '')
  const [expiresAt, setExpiresAt] = useState('')
  const [active, setActive] = useState(true)
  const [revealThreshold, setRevealThreshold] = useState(10)
  const [anonymousMode, setAnonymousMode] = useState(false)

  // Questions (2-6)
  const [questions, setQuestions] = useState<QuestionData[]>([emptyQuestion(), emptyQuestion()])

  function updateQuestion(qi: number, value: string) {
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, question_text: value } : q))
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qi) return q
        return { ...q, options: q.options.map((o, j) => j === oi ? { option_text: value } : o) }
      })
    )
  }

  function addOption(qi: number) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length >= 6) return q
        return { ...q, options: [...q.options, { option_text: '' }] }
      })
    )
  }

  function removeOption(qi: number, oi: number) {
    setQuestions(prev =>
      prev.map((q, i) => {
        if (i !== qi) return q
        return { ...q, options: q.options.filter((_, j) => j !== oi) }
      })
    )
  }

  function addQuestion() {
    if (questions.length < 6) setQuestions(prev => [...prev, emptyQuestion()])
  }

  function removeQuestion(qi: number) {
    if (questions.length > 2) setQuestions(prev => prev.filter((_, i) => i !== qi))
  }

  // Total steps: 0 (details) + questions.length + 1 (preview)
  const totalSteps = questions.length + 1
  const previewStep = totalSteps

  function canAdvance() {
    if (step === 0) return !!title.trim() && !!expiresAt
    if (step >= 1 && step <= questions.length) {
      const q = questions[step - 1]
      const first2Filled = q.options.length >= 2 && !!q.options[0].option_text.trim() && !!q.options[1].option_text.trim()
      return !!q.question_text.trim() && first2Filled
    }
    return true
  }

  function reset() {
    setStep(0)
    setTitle('')
    setDescription('')
    setTargetScope('school')
    setTargetHighschool(userProfile.highschool || '')
    setTargetYear(userProfile.graduation_year?.toString() || '')
    setTargetClass(userProfile.class || '')
    setExpiresAt('')
    setActive(true)
    setRevealThreshold(10)
    setAnonymousMode(false)
    setQuestions([emptyQuestion(), emptyQuestion()])
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
          order_index: qi,
          // Strip empty optional options (3-6)
          options: q.options
            .filter(o => o.option_text.trim())
            .map((o, oi) => ({
              option_text: o.option_text.trim(),
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

  function stepTitle() {
    if (step === 0) return 'Detalii sondaj'
    if (step >= 1 && step <= questions.length) return `Întrebarea ${step} din ${questions.length}`
    return 'Previzualizare'
  }

  const isLastQuestionStep = step === questions.length
  const isPreviewStep = step === previewStep

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepTitle()}</DialogTitle>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiră la *</label>
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

        {/* Question steps */}
        {step >= 1 && step <= questions.length && (() => {
          const qi = step - 1
          const q = questions[qi]
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Textul întrebării *</label>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={e => updateQuestion(qi, e.target.value)}
                  placeholder="Ex: Care e supraputerea ta?"
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Opțiunea {oi + 1}{oi < 2 ? ' *' : ''}
                      </label>
                      <input
                        type="text"
                        value={opt.option_text}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Opțiunea ${oi + 1}`}
                        className={inputCls}
                      />
                    </div>
                    {oi >= 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="mt-5 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    type="button"
                    onClick={() => addOption(qi)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adaugă opțiune
                  </button>
                )}
              </div>

              {/* Add/remove question controls on last question step */}
              {isLastQuestionStep && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {questions.length < 6 && (
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adaugă întrebare
                    </button>
                  )}
                  {questions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                      Elimină întrebarea
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Preview step */}
        {isPreviewStep && (
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
                  {qi + 1}. {q.question_text}
                </p>
                <div className="mt-2 space-y-1">
                  {q.options.filter(o => o.option_text.trim()).map((opt, oi) => (
                    <p key={oi} className="text-xs text-gray-500 pl-3">
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
          {!isPreviewStep ? (
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
