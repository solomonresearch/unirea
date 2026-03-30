'use client'

import { X, HeartHandshake, Tags, Sparkles, Users } from 'lucide-react'

interface MentorshipInfoModalProps {
  open: boolean
  onClose: () => void
}

export function MentorshipInfoModal({ open, onClose }: MentorshipInfoModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
        style={{ background: 'var(--white)', boxShadow: 'var(--shadow-l)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber)' }}
            >
              <HeartHandshake size={15} style={{ color: 'var(--amber-dark)' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              Cum funcționează Mentorat?
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-full transition-opacity hover:opacity-70"
            style={{ background: 'var(--cream2)', color: 'var(--ink3)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <Step
            icon={<Tags size={14} />}
            title="Profilul tău contează"
            body="Hobby-urile, domeniul profesional și profesiile selectate în setări sunt folosite automat. Nu trebuie să scrii nimic extra — datele din profil sunt deja incluse în calcul."
          />
          <Step
            icon={<Sparkles size={14} />}
            title="Ce poți oferi / ce cauți"
            body="Dacă vei completa textul din secțiunea Mentor sau Mentee, aplicația detectează categorii relevante (ex: primul job, startup, fitness). Cu cât descrii mai clar, cu atât potrivirea e mai precisă."
          />
          <Step
            icon={<Users size={14} />}
            title="Scor de potrivire"
            body="Categoriile tale sunt comparate cu ale celorlalți colegi din aceeași școală. Scorul (0–100%) reflectă câte categorii aveți în comun față de total — cu cât mai mari, cu atât mai relevanți unul pentru celălalt."
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'var(--amber-soft)', color: 'var(--amber-dark)', border: '1px solid var(--amber)' }}
        >
          Am înțeles
        </button>
      </div>
    </div>
  )
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <div
        className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 mt-0.5"
        style={{ background: 'var(--cream2)', color: 'var(--ink3)', border: '1px solid var(--border)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>{title}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--ink3)' }}>{body}</p>
      </div>
    </div>
  )
}
