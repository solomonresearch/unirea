'use client'

import { useState, useEffect } from 'react'
import { HeartHandshake } from 'lucide-react'
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
  readOnly = false,
}: {
  active: boolean
  onToggle: () => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
      <span className="text-sm font-medium" style={{ color: 'var(--ink2)' }}>
        Disponibil acum
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        onClick={readOnly ? undefined : onToggle}
        disabled={readOnly}
        className="relative flex-shrink-0"
        style={{ width: 44, height: 26, cursor: readOnly ? 'default' : 'pointer' }}
      >
        <div
          className="absolute inset-0 rounded-full transition-colors duration-200"
          style={{ background: active ? '#22c55e' : 'var(--border)' }}
        />
        <div
          className="absolute top-[3px] w-5 h-5 rounded-full transition-transform duration-200"
          style={{
            background: 'var(--white)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            transform: active ? 'translateX(21px)' : 'translateX(3px)',
          }}
        />
      </button>
    </div>
  )
}

function TabBar({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  return (
    <div className="flex gap-2 mb-3">
      {(['mentor', 'mentee'] as const).map(tab => {
        const isActive = activeTab === tab
        return (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-full py-1.5 text-sm font-semibold transition-all"
            style={
              isActive
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
        )
      })}
    </div>
  )
}

function SubLabel({ children }: { children: string }) {
  return (
    <p
      className="font-bold uppercase tracking-widest mb-1.5"
      style={{ color: 'var(--ink3)', fontSize: 10 }}
    >
      {children}
    </p>
  )
}

export function MentorshipSection({ data, readOnly = false, onSave }: MentorshipSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('mentor')
  // Live toggle state — can be flipped directly without entering edit mode
  const [mentorActive, setMentorActive] = useState(data?.mentor_active ?? false)
  const [menteeActive, setMenteeActive] = useState(data?.mentee_active ?? false)
  // Draft text state — only used inside edit mode
  const [draftMentorText, setDraftMentorText] = useState(data?.mentor_text ?? '')
  const [draftMenteeText, setDraftMenteeText] = useState(data?.mentee_text ?? '')

  // Sync live toggle state when parent data changes
  useEffect(() => {
    setMentorActive(data?.mentor_active ?? false)
    setMenteeActive(data?.mentee_active ?? false)
  }, [data?.mentor_active, data?.mentee_active])

  function initDrafts() {
    setDraftMentorText(data?.mentor_text ?? '')
    setDraftMenteeText(data?.mentee_text ?? '')
  }

  async function handleToggle(tab: Tab) {
    if (tab === 'mentor') {
      const next = !mentorActive
      setMentorActive(next)
      await onSave?.({
        mentor_text: data?.mentor_text ?? null,
        mentor_active: next,
        mentee_text: data?.mentee_text ?? null,
        mentee_active: menteeActive,
      })
    } else {
      const next = !menteeActive
      setMenteeActive(next)
      await onSave?.({
        mentor_text: data?.mentor_text ?? null,
        mentor_active: mentorActive,
        mentee_text: data?.mentee_text ?? null,
        mentee_active: next,
      })
    }
  }

  async function handleSave() {
    await onSave?.({
      mentor_text: draftMentorText || null,
      mentor_active: mentorActive,
      mentee_text: draftMenteeText || null,
      mentee_active: menteeActive,
    })
  }

  const sublabel = activeTab === 'mentor' ? 'Ce pot oferi' : 'Ce am nevoie'

  const viewContent = (
    <>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <SubLabel>{sublabel}</SubLabel>
      {activeTab === 'mentor' ? (
        <div className="space-y-3">
          {data?.mentor_text ? (
            <p className="text-sm leading-relaxed italic" style={{ color: 'var(--ink2)' }}>
              &ldquo;{data.mentor_text}&rdquo;
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--ink3)' }}>Necompletat</p>
          )}
          <AvailabilityToggle
            active={mentorActive}
            onToggle={readOnly ? () => {} : () => handleToggle('mentor')}
            readOnly={readOnly}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {data?.mentee_text ? (
            <p className="text-sm leading-relaxed italic" style={{ color: 'var(--ink2)' }}>
              &ldquo;{data.mentee_text}&rdquo;
            </p>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--ink3)' }}>Necompletat</p>
          )}
          <AvailabilityToggle
            active={menteeActive}
            onToggle={readOnly ? () => {} : () => handleToggle('mentee')}
            readOnly={readOnly}
          />
        </div>
      )}
    </>
  )

  const editContent = (
    <>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'mentor' ? (
        <div className="space-y-3">
          <div>
            <SubLabel>Ce pot oferi</SubLabel>
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
          </div>
          <AvailabilityToggle
            active={mentorActive}
            onToggle={() => setMentorActive(v => !v)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <SubLabel>Ce am nevoie</SubLabel>
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
          </div>
          <AvailabilityToggle
            active={menteeActive}
            onToggle={() => setMenteeActive(v => !v)}
          />
        </div>
      )}
    </>
  )

  const headerIcon = <HeartHandshake size={16} style={{ color: 'var(--amber)' }} />

  if (readOnly) {
    return (
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          {headerIcon}
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
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
      icon={headerIcon}
      editContent={editContent}
      onSave={handleSave}
      onEditOpen={initDrafts}
    >
      {viewContent}
    </ProfileSection>
  )
}
