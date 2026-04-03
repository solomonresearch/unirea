'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Loader2, ImagePlus } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

async function compressToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const maxDimension = 1920
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return }
          resolve(new File([blob], 'screenshot.webp', { type: 'image/webp' }))
        },
        'image/webp',
        0.85
      )
    }

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

export function FeedbackButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await getSupabase().auth.getUser()
      setVisible(!!user)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    function check() {
      setModalOpen(document.body.classList.contains('modal-open'))
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  if (!visible || modalOpen) return null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    const converted = await compressToWebP(file)
    setScreenshot(converted)
    setScreenshotPreview(URL.createObjectURL(converted))
  }

  function clearScreenshot() {
    setScreenshot(null)
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    setOpen(false)
    setMessage('')
    clearScreenshot()
  }

  async function handleSubmit() {
    if (!message.trim()) return
    setSaving(true)
    try {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('feedback')
        .eq('id', user.id)
        .single()

      const existing: { id: number; msg: string; at: string; page?: string; screenshot_path?: string }[] =
        Array.isArray(profile?.feedback) ? profile.feedback : []
      const nextId = existing.length > 0 ? Math.max(...existing.map(e => e.id)) + 1 : 1

      let screenshotPath: string | undefined
      if (screenshot) {
        const path = `${user.id}/${nextId}.webp`
        const { error: uploadError } = await supabase.storage
          .from('feedback')
          .upload(path, screenshot, { contentType: 'image/webp', upsert: true })
        if (!uploadError) screenshotPath = path
      }

      const newEntry = {
        id: nextId,
        msg: message.trim(),
        at: new Date().toISOString(),
        ...(pathname ? { page: pathname } : {}),
        ...(screenshotPath ? { screenshot_path: screenshotPath } : {}),
      }

      const { error } = await supabase
        .from('profiles')
        .update({ feedback: [...existing, newEntry] })
        .eq('id', user.id)

      if (!error) {
        setDone(true)
        setMessage('')
        clearScreenshot()
        setTimeout(() => {
          setDone(false)
          setOpen(false)
        }, 1500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Floating feedback icon button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-20 z-[140] w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
        style={{ left: 'max(16px, calc(50vw - 192px + 16px))', background: 'var(--ink)', color: 'var(--white)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
      >
        <MessageSquare size={18} />
        <span className="absolute left-full ml-2 whitespace-nowrap rounded px-2 py-1 text-xs font-semibold opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
          style={{ background: 'var(--ink)', color: 'var(--white)' }}>
          dă-ne feedback
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5 space-y-4"
            style={{ background: 'var(--white)', boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[1.1rem]" style={{ color: 'var(--ink)' }}>
                Trimite feedback
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-sm"
                style={{ background: 'var(--cream2)', color: 'var(--ink2)' }}
              >
                <X size={15} />
              </button>
            </div>

            {done ? (
              <p className="text-center py-4 text-sm font-semibold" style={{ color: 'var(--teal)' }}>
                Mulțumim pentru feedback!
              </p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Descrie funcționalitatea sau problema..."
                  rows={5}
                  className="w-full rounded-sm px-3 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--cream2)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--ink)',
                    fontFamily: 'inherit',
                  }}
                  autoFocus
                />

                {/* Screenshot attachment */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {screenshotPreview ? (
                  <div className="relative w-full rounded-sm overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotPreview} alt="captură ecran" className="w-full object-cover max-h-40" />
                    <button
                      type="button"
                      onClick={clearScreenshot}
                      className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full"
                      style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-sm py-2 text-xs font-medium transition-opacity"
                    style={{
                      background: 'var(--cream2)',
                      border: '1.5px dashed var(--border)',
                      color: 'var(--ink3)',
                    }}
                  >
                    <ImagePlus size={14} />
                    Atașează captură de ecran (opțional)
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: '#DC2626' }}
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? 'Se trimite...' : 'OK'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
