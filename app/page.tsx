'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, PlayCircle, Camera, Briefcase, BookOpen, MapPin, Users, CalendarHeart, Clock, X, Loader2 } from 'lucide-react'

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false)
  const [reqSchool, setReqSchool] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqMessage, setReqMessage] = useState('')
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSuccess, setReqSuccess] = useState(false)
  const [reqError, setReqError] = useState('')

  async function handleSchoolRequest(e: React.FormEvent) {
    e.preventDefault()
    setReqLoading(true)
    setReqError('')
    const res = await fetch('/api/school-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_name: reqSchool, email: reqEmail, message: reqMessage || undefined }),
    })
    if (res.ok) {
      setReqSuccess(true)
    } else {
      setReqError('A apărut o eroare. Încearcă din nou.')
    }
    setReqLoading(false)
  }

  function openModal() {
    setReqSchool(''); setReqEmail(''); setReqMessage(''); setReqSuccess(false); setReqError(''); setModalOpen(true)
  }

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 overflow-hidden"
      style={{ background: 'var(--cream)' }}
    >
      {/* Ambient orbs */}
      <div className="hero-orb-lavender absolute pointer-events-none" />
      <div className="hero-orb-gold absolute pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10">

        {/* Status badge */}
        <div
          className="hero-fade-down flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-medium"
          style={{ background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--ink2)' }}
        >
          <span className="hero-badge-dot w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#7ba68d' }} />
          Conectând 2.400+ comunități de absolvenți
        </div>

        {/* Headline */}
        <h1
          className="hero-fade-up font-display text-[2.4rem] text-center leading-[1.08] mb-4"
          style={{ color: 'var(--ink)', animationDelay: '0.2s' }}
        >
          Anii tăi de liceu.<br />
          <span className="relative inline-block">
            <em style={{ color: '#ef6b4a', fontStyle: 'italic' }}>Oamenii tăi.</em>
            <span
              className="absolute rounded-sm pointer-events-none"
              style={{ left: -4, right: -4, bottom: 3, height: 10, background: 'rgba(245,213,144,0.55)', zIndex: -1 }}
            />
          </span>
          <br />
          Pentru totdeauna.
        </h1>

        {/* Subheadline */}
        <p
          className="hero-fade-up text-sm text-center leading-[1.65] mb-7"
          style={{ color: 'var(--ink2)', maxWidth: 310, animationDelay: '0.4s' }}
        >
          Platforma absolvenților unde amintirile de liceu prind viață, mentorii întâlnesc talente noi, iar prietenii vechi plănuiesc aventuri noi.
        </p>

        {/* CTA buttons */}
        <div className="hero-fade-up flex flex-col w-full gap-3 mb-8" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/inregistrare"
            className="hero-cta-primary flex items-center justify-center gap-2 w-full py-4 rounded-full text-sm font-bold text-white"
          >
            <Search size={17} />
            Creează cont
          </Link>
          <Link
            href="/autentificare"
            className="hero-cta-secondary flex items-center justify-center gap-2 w-full py-4 rounded-full text-sm font-semibold"
          >
            <PlayCircle size={17} />
            Am deja cont
          </Link>
        </div>

        {/* School request link */}
        <button
          type="button"
          onClick={openModal}
          className="hero-fade-up text-xs mb-6"
          style={{ color: 'var(--ink3)', animationDelay: '0.7s', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Nu găsești școala ta?{' '}
          <span className="underline" style={{ color: 'var(--amber-dark)' }}>Solicită adăugarea</span>
        </button>

        {/* Floating card cluster — 2-col grid */}
        <div className="hero-fade-up w-full grid grid-cols-2 gap-3" style={{ animationDelay: '0.8s' }}>

          {/* Card A — Photo */}
          <div
            className="hero-float rounded-xl flex items-center justify-center"
            style={{
              height: 130,
              background: 'linear-gradient(135deg, #d4cee8, #9b8ec4)',
              boxShadow: '0 8px 32px rgba(26,31,58,0.08)',
              animationDelay: '0s',
            }}
          >
            <Camera size={42} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>

          {/* Card C — Nearby Hangout map */}
          <div
            className="hero-float rounded-xl p-3 flex flex-col"
            style={{
              height: 130,
              background: 'var(--white)',
              boxShadow: '0 8px 32px rgba(26,31,58,0.08)',
              animationDelay: '0.5s',
            }}
          >
            <p className="text-3xs font-bold uppercase mb-2 flex items-center gap-1" style={{ color: '#ef6b4a', letterSpacing: '1.5px' }}>
              <MapPin size={9} />
              Ne vedem in oras?
            </p>
            {/* Mini map */}
            <div className="relative flex-1 rounded-lg overflow-hidden">
              {/* Brașov OSM tile */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://tile.openstreetmap.org/14/9350/5852.png"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.75 }}
              />
              {/* Subtle warm overlay so dots pop */}
              <div className="absolute inset-0" style={{ background: 'rgba(247,243,236,0.25)' }} />
              {/* Pulsing dots */}
              <span className="hero-ping absolute" style={{ top: '28%', left: '35%', background: '#ef6b4a', animationDelay: '0s' }} />
              <span className="hero-ping absolute" style={{ top: '58%', left: '62%', background: '#7ba68d', animationDelay: '0.5s' }} />
              <span className="hero-ping absolute" style={{ top: '72%', left: '22%', background: '#f5d590', animationDelay: '1s' }} />
            </div>
          </div>

          {/* Card E — Stats (full width) */}
          <div
            className="hero-float col-span-2 rounded-xl p-4 flex items-center gap-3"
            style={{
              background: '#1a1f3a',
              boxShadow: '0 8px 32px rgba(26,31,58,0.08)',
              animationDelay: '1.5s',
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 40, height: 40, background: 'rgba(245,213,144,0.2)' }}
            >
              <Users size={20} style={{ color: '#f5d590' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Colegi Reconectați</p>
          </div>

          {/* Card B — Mentor */}
          <div
            className="hero-float rounded-xl p-3"
            style={{
              background: 'var(--white)',
              boxShadow: '0 8px 32px rgba(26,31,58,0.08)',
              animationDelay: '1s',
            }}
          >
            <p
              className="text-3xs font-bold uppercase mb-2.5"
              style={{ color: '#7ba68d', letterSpacing: '1.5px' }}
            >
              Mentorat
            </p>
            <div className="flex items-center mb-2.5">
              <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: '#7ba68d' }}>
                <Briefcase size={15} color="white" />
              </div>
              <div className="flex-1 h-px mx-2" style={{ background: 'linear-gradient(to right, #7ba68d, #f5d590)' }} />
              <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: '#f5d590' }}>
                <BookOpen size={15} color="white" />
              </div>
            </div>
            <p className="text-2xs leading-[1.4]" style={{ color: 'var(--ink2)' }}>Maria ('08) îndrumă Alex în carieră</p>
          </div>

          {/* Card F — Event */}
          <div
            className="hero-float rounded-xl p-3"
            style={{
              background: 'var(--white)',
              boxShadow: '0 8px 32px rgba(26,31,58,0.08)',
              animationDelay: '3s',
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl mb-2.5"
              style={{ width: 36, height: 36, background: 'rgba(212,206,232,0.4)' }}
            >
              <CalendarHeart size={18} style={{ color: '#9b8ec4' }} />
            </div>
            <p className="text-xxs font-bold leading-tight" style={{ color: '#1a1f3a' }}>
              Reuniune Promoția &apos;15
            </p>
            <p className="text-2xs mt-1 flex items-center gap-1" style={{ color: 'var(--ink3)' }}>
              <Clock size={9} />
              Sâmbătă 15:00 · Herăstrău
            </p>
          </div>

        </div>

        <p className="text-2xs text-center mt-5" style={{ color: 'var(--ink3)' }}>
          Disponibil pentru primele 100 de licee selectate
        </p>
        <p className="text-2xs text-center mt-2" style={{ color: 'var(--ink3)' }}>
          Prin continuare ești de acord cu{' '}
          <Link href="/termeni" className="underline">Termenii de utilizare</Link>
        </p>
      </div>

      {/* School request modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5 space-y-4"
            style={{ background: 'var(--white)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base" style={{ color: 'var(--ink)' }}>Solicită adăugarea școlii</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-sm"
                style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
              >
                <X size={15} />
              </button>
            </div>

            {reqSuccess ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Cerere trimisă!</p>
                <p className="text-xs" style={{ color: 'var(--ink3)' }}>Un administrator va analiza solicitarea ta în curând.</p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-2 px-4 py-2 rounded-md text-xs font-semibold"
                  style={{ background: 'var(--ink)', color: 'var(--white)' }}
                >
                  Închide
                </button>
              </div>
            ) : (
              <form onSubmit={handleSchoolRequest} className="space-y-3">
                <input
                  type="text"
                  required
                  value={reqSchool}
                  onChange={e => setReqSchool(e.target.value)}
                  placeholder="Numele școlii"
                  className="w-full px-3 py-2.5 text-sm rounded-md outline-none"
                  style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
                />
                <input
                  type="email"
                  required
                  value={reqEmail}
                  onChange={e => setReqEmail(e.target.value)}
                  placeholder="Email-ul tău"
                  className="w-full px-3 py-2.5 text-sm rounded-md outline-none"
                  style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
                />
                <textarea
                  value={reqMessage}
                  onChange={e => setReqMessage(e.target.value)}
                  placeholder="Mesaj opțional..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-md outline-none resize-none"
                  style={{ background: 'var(--cream2)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'inherit' }}
                />
                {reqError && (
                  <p className="text-xs" style={{ color: 'var(--rose)' }}>{reqError}</p>
                )}
                <button
                  type="submit"
                  disabled={reqLoading}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'var(--ink)', fontFamily: 'inherit' }}
                >
                  {reqLoading && <Loader2 size={15} className="animate-spin" />}
                  {reqLoading ? 'Se trimite...' : 'Trimite cererea'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .hero-ping {
          width: 8px; height: 8px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .hero-ping::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: inherit;
          animation: map-ping 2s ease-out infinite;
          animation-delay: inherit;
        }

        .hero-orb-lavender {
          width: 400px; height: 400px;
          top: -150px; right: -150px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,206,232,0.4) 0%, transparent 70%);
          animation: float-slow 20s ease-in-out infinite;
        }
        .hero-orb-gold {
          width: 300px; height: 300px;
          bottom: -80px; left: -120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,213,144,0.3) 0%, transparent 70%);
          animation: float-slow 15s ease-in-out infinite reverse;
        }
        .hero-fade-down {
          animation: fadeInDown 0.8s ease-out both;
        }
        .hero-fade-up {
          animation: fadeInUp 0.8s ease-out both;
        }
        .hero-float {
          animation: float-item 6s ease-in-out infinite;
          transition: transform 0.2s ease;
        }
        .hero-float:hover {
          transform: scale(1.04);
        }
        .hero-badge-dot {
          animation: badge-pulse 2s ease-in-out infinite;
        }
        .hero-cta-primary {
          background: #ef6b4a;
          box-shadow: 0 4px 20px rgba(239,107,74,0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .hero-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(239,107,74,0.45);
        }
        .hero-cta-secondary {
          border: 2px solid var(--ink);
          color: var(--ink);
          background: transparent;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .hero-cta-secondary:hover {
          background: var(--ink);
          color: var(--cream);
        }
      ` }} />
    </main>
  )
}
