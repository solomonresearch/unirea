'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  profile: { highschool: string; name: string }
  onDismiss: () => void
}

function AvizierIllustration() {
  return (
    <div className="w-full flex flex-col gap-1.5 px-2">
      {[
        { initials: 'AM', name: 'Alexandru M.', text: 'Cineva știe dacă biblioteca e deschisă?', votes: 4, bg: '#5B8E6D' },
        { initials: 'IG', name: 'Ioana G.', text: 'Reuniunea de 10 ani — cine vine?', votes: 12, bg: '#7B6D9E' },
        { initials: 'RD', name: 'Radu D.', text: 'Am găsit o agendă lângă vestiar.', votes: 2, bg: '#4A7B9A' },
      ].map((row, i) => (
        <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: row.bg }}>
            {row.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{row.name}</div>
            <div className="text-[9px] leading-tight truncate" style={{ color: 'var(--ink2)' }}>{row.text}</div>
          </div>
          <div className="flex flex-col items-center gap-0 flex-shrink-0">
            <span className="text-[7px] leading-none" style={{ color: 'var(--amber)' }}>▲</span>
            <span className="text-[8px] font-bold leading-tight" style={{ color: 'var(--ink)' }}>{row.votes}</span>
            <span className="text-[7px] leading-none" style={{ color: 'var(--ink3)' }}>▼</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AmintiriIllustration() {
  return (
    <div className="w-full flex justify-center items-center gap-5">
      <div className="bg-white rounded-lg p-1.5 shadow-md" style={{ transform: 'rotate(-5deg)' }}>
        <div className="w-16 h-16 rounded flex items-center justify-center text-2xl" style={{ background: 'var(--cream2)' }}>🌅</div>
        <div className="text-[8px] text-center mt-1" style={{ color: 'var(--ink2)' }}>Ultima zi</div>
      </div>
      <div className="bg-white rounded-lg p-1.5 shadow-md" style={{ transform: 'rotate(4deg)' }}>
        <div className="w-16 h-16 rounded flex items-center justify-center text-2xl" style={{ background: 'var(--amber-soft)' }}>🎓</div>
        <div className="text-[8px] text-center mt-1" style={{ color: 'var(--ink2)' }}>Festivitatea</div>
      </div>
    </div>
  )
}

function PosteazaIllustration() {
  return (
    <div className="w-full flex flex-col gap-1.5 px-2">
      {[
        { icon: '📊', label: 'Creează un sondaj' },
        { icon: '📢', label: 'Scrie un anunț' },
        { icon: '📷', label: 'Distribuie o amintire' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 shadow-sm">
          <span className="text-base">{item.icon}</span>
          <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function CercuriIllustration() {
  return (
    <div className="w-full flex justify-center items-center">
      <div className="relative" style={{ width: '160px', height: '110px' }}>
        <div className="absolute rounded-full opacity-40" style={{ background: '#7B6D9E', left: '0%', top: '8%', width: '52%', height: '72%' }} />
        <div className="absolute rounded-full opacity-40" style={{ background: '#5B8E6D', left: '24%', top: '0%', width: '52%', height: '72%' }} />
        <div className="absolute rounded-full opacity-40" style={{ background: '#C4634A', left: '10%', top: '38%', width: '42%', height: '55%' }} />
        <div className="absolute rounded-full opacity-40" style={{ background: '#4A7B9A', left: '48%', top: '36%', width: '42%', height: '55%' }} />
        <div className="absolute text-[8px] font-bold text-white" style={{ left: '5%', top: '28%' }}>Liceu</div>
        <div className="absolute text-[8px] font-bold text-white" style={{ left: '54%', top: '14%' }}>Hobby</div>
        <div className="absolute text-[8px]" style={{ left: '18%', top: '62%' }}>📷</div>
        <div className="absolute text-[8px]" style={{ left: '60%', top: '60%' }}>📍</div>
      </div>
    </div>
  )
}

function MesajeIllustration() {
  return (
    <div className="w-full flex flex-col gap-1.5 px-2">
      {[
        { initials: 'MC', name: 'Maria C.', msg: 'Bună! Cum mai ești?', time: '10:32', bg: '#C4634A' },
        { initials: 'AP', name: 'Andrei P.', msg: 'Ai văzut poza aia de la bal?', time: 'Ieri', bg: '#5B8E6D' },
        { initials: 'EV', name: 'Elena V.', msg: 'Ne vedem la reuniune!', time: 'Luni', bg: '#7B6D9E' },
      ].map((row, i) => (
        <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: row.bg }}>
            {row.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>{row.name}</div>
            <div className="text-[9px] truncate leading-tight" style={{ color: 'var(--ink2)' }}>{row.msg}</div>
          </div>
          <div className="text-[8px] flex-shrink-0" style={{ color: 'var(--ink3)' }}>{row.time}</div>
        </div>
      ))}
    </div>
  )
}

const slides = [
  {
    label: 'ECRANUL 1',
    title: 'Avizierul',
    description: 'Anunțuri rapide de la foști colegi, cu vot și expirare automată. Postează ceva sau votează ce contează pentru tine.',
    Illustration: AvizierIllustration,
  },
  {
    label: 'ECRANUL 2',
    title: 'Amintiri',
    description: 'Fotografii din liceu, promoție sau clasa ta — în stil polaroid. Distribuie o amintire și descoperă momentele altora.',
    Illustration: AmintiriIllustration,
  },
  {
    label: 'ECRANUL 3',
    title: 'Postează',
    description: 'Apasă + oricând pentru a posta un sondaj, un anunț sau o fotografie cu amintiri.',
    Illustration: PosteazaIllustration,
  },
  {
    label: 'ECRANUL 4',
    title: 'Cercuri',
    description: 'Descoperă foști colegi după liceu, hobby-uri, profesie sau oraș. Cu cât mai multe în comun, cu atât cercul e mai mare.',
    Illustration: CercuriIllustration,
  },
  {
    label: 'ECRANUL 5',
    title: 'Mesaje',
    description: 'Conversații private cu foști colegi — individual sau în grup. Reconectează-te cu oameni pe care i-ai pierdut din vedere.',
    Illustration: MesajeIllustration,
  },
]

export function TutorialModal({ profile, onDismiss }: Props) {
  const [step, setStep] = useState(0)
  const { label, title, description, Illustration } = slides[step]
  const isLast = step === slides.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm"
      style={{ background: 'rgba(26,23,20,0.45)' }}
    >
      <div
        className="w-full max-w-xs mx-auto rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--cream)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--ink)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-[10px]">U</div>
            <div>
              <div className="text-white text-[11px] font-semibold leading-tight">Bun venit pe unirea!</div>
              <div className="text-white/55 text-[9px] leading-tight truncate max-w-[160px]">{profile.highschool}</div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 text-white/65 hover:text-white text-[11px] transition-colors"
          >
            Sari peste <X size={12} />
          </button>
        </div>

        {/* Illustration — fixed height so all slides align */}
        <div
          className="flex items-center justify-center px-4 py-3"
          style={{ background: 'var(--cream)', height: '140px' }}
        >
          <Illustration />
        </div>

        {/* Text content — fixed height so buttons stay put */}
        <div className="px-4" style={{ height: '88px' }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--amber)' }} />
            <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: 'var(--amber)' }}>{label}</span>
          </div>
          <h2 className="text-xl font-bold mb-1 leading-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--ink2)' }}>{description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-2.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={i === step
                ? { width: '20px', height: '6px', background: 'var(--amber)' }
                : { width: '6px', height: '6px', background: 'var(--border)' }
              }
            />
          ))}
        </div>

        {/* Navigation — back button always reserves space */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center justify-center px-3 py-2 rounded-xl border text-sm transition-colors"
            style={{
              borderColor: 'var(--border)',
              background: step === 0 ? 'transparent' : 'white',
              color: step === 0 ? 'transparent' : 'var(--ink)',
              borderColor: step === 0 ? 'transparent' : 'var(--border)',
              pointerEvents: step === 0 ? 'none' : 'auto',
            }}
            aria-hidden={step === 0}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={isLast ? onDismiss : () => setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-semibold text-sm text-white transition-colors"
            style={{ background: isLast ? 'var(--amber)' : 'var(--ink)' }}
          >
            {isLast ? 'Hai să începem! 🎉' : <><span>Continuă</span><ChevronRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
