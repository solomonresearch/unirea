'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { getSupabase } from '@/lib/supabase'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiTagInput } from '@/components/MultiTagInput'
import { COUNTRIES } from '@/lib/countries'
import { ROMANIAN_CITIES } from '@/lib/romanian-cities'
import { PROFESSIONS } from '@/lib/professions'
import { DOMAINS } from '@/lib/domains'
import { HOBBY_OPTIONS } from '@/lib/hobbies'
import {
  Briefcase, MapPin, Globe, Building, ArrowRight, ArrowLeft,
  Heart, Layers, Loader2, Sparkles, Check
} from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [profession, setProfession] = useState<string[]>([])
  const [domain, setDomain] = useState<string[]>([])

  const [country, setCountry] = useState('Romania')
  const [city, setCity] = useState('')
  const [hobbies, setHobbies] = useState<string[]>([])
  const [bio, setBio] = useState('')

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry)
    setCity('')
  }

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await getSupabase().auth.getUser()
      if (!user) { router.push('/autentificare'); return }
      setUserId(user.id)

      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) router.push('/profil')
    }
    checkAuth()
  }, [router])

  function toggleHobby(hobby: string) {
    setHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    )
  }

  async function handleFinish() {
    if (!userId) return
    setLoading(true)

    const { error } = await getSupabase()
      .from('profiles')
      .update({
        profession,
        domain,
        country,
        city,
        hobbies,
        bio,
        onboarding_completed: true,
      })
      .eq('id', userId)

    if (!error) router.push('/profil')
    setLoading(false)
  }

  const inputClass = "w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
  const iconClass = "absolute left-3 top-2.5 text-gray-400 pointer-events-none"

  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-6">
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <h1 className="text-lg font-bold text-gray-900">Spune-ne despre tine</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary-700' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Step 1: Profession & Location */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase size={18} className="text-primary-700" />
                Profesie si locatie
              </h2>
              <p className="text-xs text-gray-500">Unde lucrezi si unde locuiesti acum?</p>
            </div>

            <div className="space-y-2.5">
              <MultiTagInput
                options={PROFESSIONS}
                selected={profession}
                onChange={setProfession}
                placeholder="Profesii (ex: Inginer, Profesor)"
                icon={<Briefcase size={15} />}
              />

              <MultiTagInput
                options={DOMAINS}
                selected={domain}
                onChange={setDomain}
                placeholder="Domenii (ex: IT, Sanatate)"
                icon={<Layers size={15} />}
              />

              <SearchSelect
                options={COUNTRIES}
                value={country}
                onChange={handleCountryChange}
                placeholder="Tara"
                icon={<Globe size={15} />}
              />

              {country === 'Romania' ? (
                <SearchSelect
                  options={ROMANIAN_CITIES}
                  value={city}
                  onChange={setCity}
                  placeholder="Orasul"
                  icon={<Building size={15} />}
                />
              ) : (
                <div className="relative">
                  <Building size={15} className={iconClass} />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Orasul"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Hobbies */}
        {step === 2 && (
          <div className="space-y-3 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Heart size={18} className="text-primary-700" />
                Hobby-uri
              </h2>
              <p className="text-xs text-gray-500">Ce iti place sa faci? Selecteaza mai multe.</p>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {HOBBY_OPTIONS.map(({ label, icon: Icon }) => {
                const selected = hobbies.includes(label)
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleHobby(label)}
                    className={`flex flex-col items-center gap-0.5 rounded-md border px-0.5 py-1.5 text-[10px] font-medium transition-all ${
                      selected
                        ? 'border-primary-700 bg-primary-50 text-primary-700 shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: About yourself */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-primary-700" />
                Despre tine
              </h2>
              <p className="text-xs text-gray-500">Scrie cateva cuvinte despre tine — ce te defineste?</p>
            </div>

            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Povesteste-ne despre tine, ce te pasioneaza, ce planuri ai..."
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none"
            />

            {/* Summary */}
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-sm">
              {profession.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase size={14} className="text-primary-700" />
                  {profession.join(', ')}
                </div>
              )}
              {domain.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Layers size={14} className="text-primary-700" />
                  {domain.join(', ')}
                </div>
              )}
              {(country || city) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="text-primary-700" />
                  {[city, country].filter(Boolean).join(', ')}
                </div>
              )}
              {hobbies.length > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart size={14} className="text-primary-700" />
                  {hobbies.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2.5 pt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex items-center justify-center gap-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Inapoi
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
            >
              Continua
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {loading ? 'Se salveaza...' : 'Finalizeaza'}
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={handleFinish}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Completeaza mai tarziu
        </button>
      </div>
    </main>
  )
}
