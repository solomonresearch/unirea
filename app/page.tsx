import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo size={64} />
          <h1 className="text-3xl font-bold text-gray-900">Unirea</h1>
          <p className="text-gray-500 text-sm">Reteaua absolventilor</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/inregistrare"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary-700 px-4 py-3.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
          >
            Creeaza cont
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/autentificare"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-300 px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Autentificare
          </Link>
        </div>
      </div>
    </main>
  )
}
