import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-7"
      style={{ background: 'var(--cream)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Concentric circles illustration */}
        <div className="relative w-[220px] h-[220px] mb-7 flex-shrink-0">
          {/* Rings */}
          <div className="absolute rounded-full" style={{ width: 60, height: 60, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--amber-soft)', border: '1.5px solid var(--amber)' }} />
          <div className="absolute rounded-full" style={{ width: 110, height: 110, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1.5px solid rgba(232,150,58,0.4)' }} />
          <div className="absolute rounded-full" style={{ width: 160, height: 160, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1.5px solid rgba(232,150,58,0.2)' }} />
          <div className="absolute rounded-full" style={{ width: 210, height: 210, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', border: '1.5px solid rgba(232,150,58,0.1)' }} />
          {/* Center */}
          <div className="absolute rounded-full flex items-center justify-center font-display text-[20px] text-white z-10" style={{ width: 52, height: 52, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--amber)', boxShadow: '0 0 0 3px var(--amber-soft), var(--shadow-m)' }}>
            U
          </div>
          {/* Inner ring avatars */}
          <div className="absolute rounded-full border-2 border-white" style={{ width: 28, height: 28, background: '#5B8E6D', top: '18%', left: '52%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 28, height: 28, background: '#7B6D9E', top: '52%', left: '72%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 28, height: 28, background: '#C4634A', top: '68%', left: '36%', boxShadow: 'var(--shadow-m)' }} />
          {/* Mid ring avatars */}
          <div className="absolute rounded-full border-2 border-white" style={{ width: 24, height: 24, background: '#4A7B9A', top: '8%', left: '32%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 24, height: 24, background: '#8E6B4A', top: '12%', left: '60%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 24, height: 24, background: '#4A8E6B', top: '62%', left: '76%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 24, height: 24, background: '#9E7B5A', top: '78%', left: '52%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 24, height: 24, background: '#6B4A8E', top: '70%', left: '20%', boxShadow: 'var(--shadow-m)' }} />
          <div className="absolute rounded-full border-2 border-white" style={{ width: 24, height: 24, background: '#8E4A6B', top: '28%', left: '14%', boxShadow: 'var(--shadow-m)' }} />
        </div>

        {/* Heading */}
        <h1
          className="font-display text-[2rem] text-center leading-[1.2] mb-2.5"
          style={{ color: 'var(--ink)' }}
        >
          Bun venit în<br />
          <em className="italic" style={{ color: 'var(--amber)' }}>cercul tău</em>
        </h1>

        <p
          className="text-[0.77rem] text-center leading-[1.7] mb-7"
          style={{ color: 'var(--ink2)' }}
        >
          Reconectează-te cu colegii de liceu.<br />
          Rețeaua absolvenților.
        </p>

        {/* Buttons */}
        <div className="w-full space-y-2.5">
          <Link
            href="/inregistrare"
            className="flex items-center justify-center gap-2 w-full py-[15px] rounded-md text-[0.88rem] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--ink)' }}
          >
            Creeaza cont
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/autentificare"
            className="flex items-center justify-center w-full py-[14px] rounded-md text-[0.82rem] font-semibold transition-colors"
            style={{ border: '1.5px solid var(--border)', color: 'var(--ink2)', background: 'transparent' }}
          >
            Am deja cont
          </Link>
        </div>

        <p className="text-[0.63rem] text-center mt-3.5" style={{ color: 'var(--ink3)' }}>
          Prin continuare ești de acord cu{' '}
          <span className="underline cursor-pointer">Termenii de utilizare</span>
        </p>
      </div>
    </main>
  )
}
