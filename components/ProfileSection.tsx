'use client'

import { useState } from 'react'
import { Pencil, Loader2 } from 'lucide-react'

interface ProfileSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  editContent: React.ReactNode
  onSave: () => Promise<void>
}

export function ProfileSection({ title, icon, children, editContent, onSave }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave()
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-gray-400 hover:text-primary-700 transition-colors"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {editContent}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Se salveaza...' : 'Salveaza'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Anuleaza
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
