'use client'

import { useState } from 'react'
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
            className="flex-1 rounded-full py-1.5 text-xs font-bold tracking-wide uppercase transition-all"
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
            {isActive ? `✓ ${tab === 'mentor' ? 'Mentor' : 'Mentee'}` : tab === 'mentor' ? 'Mentor' : 'Mentee'}
          </button>
        )
      })}
    </div>
  )
}

function SubLabel({ children }: { children: string }) {
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
      style={{ color: 'var(--ink3)' }}
    >
      {children}
    </p>
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
            active={data?.mentor_active ?? false}
            onToggle={() => {}}
            readOnly
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
            active={data?.mentee_active ?? false}
            onToggle={() => {}}
            readOnly
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
            active={draftMentorActive}
            onToggle={() => setDraftMentorActive(v => !v)}
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
            active={draftMenteeActive}
            onToggle={() => setDraftMenteeActive(v => !v)}
          />
        </div>
      )}
    </>
  )

  const headerIcon = <span style={{ fontSize: 16 }}>🤝</span>

  if (readOnly) {
    return (
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: 'var(--white)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-s)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          {headerIcon}
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Mentorship
          </span>
        </div>
        {viewContent}
      </div>
    )
  }

  return (
    <ProfileSection
      title="Mentorship"
      icon={headerIcon}
      editContent={editContent}
      onSave={handleSave}
      onEditOpen={initDrafts}
    >
      {viewContent}
    </ProfileSection>
  )
}
