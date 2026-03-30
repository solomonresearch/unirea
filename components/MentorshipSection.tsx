'use client'

import { useState } from 'react'
import { Lightbulb, Loader2, Pencil } from 'lucide-react'
import { ProfileSection } from '@/components/ProfileSection'

export interface MentorshipData {
  mentor_text: string | null
  mentor_active: boolean
  mentee_text: string | null
  mentee_active: boolean
}

interface MentorshipSectionProps {
  data: MentorshipData | null
  readOnly?: boolean
  onSave?: (patch: MentorshipData) => Promise<void>
}

type Tab = 'mentor' | 'mentee'

function AvailabilityToggle({
  active,
  onToggle,
  label,
}: {
  active: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className="flex items-center gap-1.5"
    >
      <div
        className="relative w-8 h-[18px] rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: active ? 'var(--amber)' : 'var(--border)' }}
      >
        <div
          className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-transform duration-200"
          style={{
            background: 'var(--white)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transform: active ? 'translateX(16px)' : 'translateX(2px)',
          }}
        />
      </div>
      <span className="text-xxs" style={{ color: active ? 'var(--amber-dark)' : 'var(--ink3)' }}>
        {label}
      </span>
    </button>
  )
}

function TabBar({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  return (
    <div className="flex gap-2 mb-3">
      {(['mentor', 'mentee'] as const).map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          className="flex-1 rounded-full py-1.5 text-xs font-semibold transition-all"
          style={
            activeTab === tab
              ? {
                  background: 'var(--amber-soft)',
                  border: '1.5px solid var(--amber)',
                  color: 'var(--amber-dark)',
                }
              : {
                  background: 'var(--white)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--ink3)',
                }
          }
        >
          {tab === 'mentor' ? 'Mentor' : 'Mentee'}
        </button>
      ))}
    </div>
  )
}

export function MentorshipSection({ data, readOnly = false, onSave }: MentorshipSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('mentor')
  const [draftMentorText, setDraftMentorText] = useState(data?.mentor_text ?? '')
  const [draftMentorActive, setDraftMentorActive] = useState(data?.mentor_active ?? false)
  const [draftMenteeText, setDraftMenteeText] = useState(data?.mentee_text ?? '')
  const [draftMenteeActive, setDraftMenteeActive] = useState(data?.mentee_active ?? false)

  function initDrafts() {
    setDraftMentorText(data?.mentor_text ?? '')
    setDraftMentorActive(data?.mentor_active ?? false)
    setDraftMenteeText(data?.mentee_text ?? '')
    setDraftMenteeActive(data?.mentee_active ?? false)
  }

  async function handleSave() {
    await onSave?.({
      mentor_text: draftMentorText || null,
      mentor_active: draftMentorActive,
      mentee_text: draftMenteeText || null,
      mentee_active: draftMenteeActive,
    })
  }

  const mentorActive = data?.mentor_active ?? false
  const menteeActive = data?.mentee_active ?? false

  const viewContent = (
    <>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'mentor' ? (
        <div className="space-y-2">
          {data?.mentor_text ? (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
              {data.mentor_text}
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--ink3)' }}>Necompletat</p>
          )}
          <div className="pt-1">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={
                mentorActive
                  ? { background: 'var(--teal-soft)', border: '1px solid var(--teal)', color: 'var(--teal)' }
                  : { background: 'var(--cream2)', border: '1px solid var(--border)', color: 'var(--ink3)' }
              }
            >
              {mentorActive ? 'Disponibil' : 'Indisponibil'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {data?.mentee_text ? (
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink2)' }}>
              {data.mentee_text}
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--ink3)' }}>Necompletat</p>
          )}
          <div className="pt-1">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={
                menteeActive
                  ? { background: 'var(--teal-soft)', border: '1px solid var(--teal)', color: 'var(--teal)' }
                  : { background: 'var(--cream2)', border: '1px solid var(--border)', color: 'var(--ink3)' }
              }
            >
              {menteeActive ? 'Disponibil' : 'Indisponibil'}
            </span>
          </div>
        </div>
      )}
    </>
  )

  const editContent = (
    <>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'mentor' ? (
        <div className="space-y-3">
          <textarea
            rows={4}
            value={draftMentorText}
            onChange={e => setDraftMentorText(e.target.value)}
            placeholder="Ex: pot ajuta cu primul job, anxietatea schimbării carierei, mutatul în altă țară sau co-fondatul unui proiect..."
            className="w-full rounded-sm px-3 py-2.5 text-sm resize-none"
            style={{
              background: 'var(--cream2)',
              border: '1.5px solid var(--border)',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
          <AvailabilityToggle
            active={draftMentorActive}
            onToggle={() => setDraftMentorActive(v => !v)}
            label={draftMentorActive ? 'Disponibil' : 'Indisponibil'}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={4}
            value={draftMenteeText}
            onChange={e => setDraftMenteeText(e.target.value)}
            placeholder="Ce situație încerc să navighez acum și ce fel de perspectivă ar fi utilă..."
            className="w-full rounded-sm px-3 py-2.5 text-sm resize-none"
            style={{
              background: 'var(--cream2)',
              border: '1.5px solid var(--border)',
              color: 'var(--ink)',
              outline: 'none',
            }}
          />
          <AvailabilityToggle
            active={draftMenteeActive}
            onToggle={() => setDraftMenteeActive(v => !v)}
            label={draftMenteeActive ? 'Disponibil' : 'Indisponibil'}
          />
        </div>
      )}
    </>
  )

  if (readOnly) {
    return (
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} style={{ color: 'var(--amber)' }} />
          <span className="text-xxs font-bold uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>
            Mentorat
          </span>
        </div>
        {viewContent}
      </div>
    )
  }

  return (
    <ProfileSection
      title="Mentorat"
      icon={<Lightbulb size={16} style={{ color: 'var(--amber)' }} />}
      editContent={editContent}
      onSave={handleSave}
      onEditOpen={initDrafts}
    >
      {viewContent}
    </ProfileSection>
  )
}
