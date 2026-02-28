'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Copy, Check, UserPlus, LogOut, Search, Loader2, Trash2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface Member {
  id: string
  name: string
  username: string
  avatar_url: string | null
}

interface Props {
  conversationId: string
  name: string
  inviteCode: string
  members: Member[]
  currentUserId: string
  onClose: () => void
  onNameUpdated: (name: string) => void
  onMembersUpdated: (members: Member[]) => void
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function GroupInfoPanel({
  conversationId, name, inviteCode, members, currentUserId,
  onClose, onNameUpdated, onMembersUpdated,
}: Props) {
  const router = useRouter()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(name)
  const [savingName, setSavingName] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [searching, setSearching] = useState(false)
  const [addingUser, setAddingUser] = useState<string | null>(null)
  const [removingUser, setRemovingUser] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  async function handleSaveName() {
    if (!nameInput.trim() || savingName) return
    setSavingName(true)
    const res = await fetch(`/api/mesaje/grupuri/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim() }),
    })
    if (res.ok) {
      onNameUpdated(nameInput.trim())
      setEditingName(false)
    }
    setSavingName(false)
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/mesaje/invitatie/${inviteCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setSearching(true)
      const supabase = getSupabase()
      const q = searchQuery.trim()
      const memberIds = members.map(m => m.id)

      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('onboarding_completed', true)
        .not('id', 'in', `(${memberIds.join(',')})`)
        .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(10)

      setSearchResults((data || []) as Member[])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, members])

  async function handleAddMember(userId: string) {
    if (addingUser) return
    setAddingUser(userId)
    const res = await fetch(`/api/mesaje/grupuri/${conversationId}/membri`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_ids: [userId] }),
    })
    if (res.ok) {
      const added = searchResults.find(u => u.id === userId)
      if (added) {
        onMembersUpdated([...members, added])
        setSearchResults(prev => prev.filter(u => u.id !== userId))
      }
    }
    setAddingUser(null)
  }

  async function handleRemoveMember(userId: string) {
    if (removingUser) return
    setRemovingUser(userId)
    const res = await fetch(`/api/mesaje/grupuri/${conversationId}/membri`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) {
      onMembersUpdated(members.filter(m => m.id !== userId))
    }
    setRemovingUser(null)
  }

  async function handleLeave() {
    if (leaving) return
    setLeaving(true)
    const res = await fetch(`/api/mesaje/grupuri/${conversationId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/mesaje')
    }
    setLeaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900">Info grup</span>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Group name */}
          <div>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={100}
                  autoFocus
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName || !nameInput.trim()}
                  className="rounded-lg bg-primary-700 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {savingName ? <Loader2 size={14} className="animate-spin" /> : 'OK'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setNameInput(name) }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                >
                  Anuleaza
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="text-left w-full"
              >
                <p className="text-xs text-gray-400 mb-1">Numele grupului</p>
                <p className="text-sm font-semibold text-gray-900">{name}</p>
              </button>
            )}
          </div>

          {/* Invite link */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Link de invitatie</p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:border-primary-200 transition-colors"
            >
              <span className="text-xs text-gray-600 truncate flex-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/mesaje/invitatie/${inviteCode}` : `.../${inviteCode}`}
              </span>
              {copied ? (
                <Check size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <Copy size={16} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Membri ({members.length})</p>
              <button
                type="button"
                onClick={() => setShowAddMember(!showAddMember)}
                className="text-primary-700 hover:text-primary-800"
              >
                <UserPlus size={16} />
              </button>
            </div>

            {showAddMember && (
              <div className="mb-3 space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cauta un coleg..."
                    autoFocus
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-300 focus:ring-1 focus:ring-primary-300 outline-none"
                  />
                </div>
                {searching && (
                  <div className="flex justify-center py-2">
                    <Loader2 size={14} className="animate-spin text-gray-400" />
                  </div>
                )}
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAddMember(user.id)}
                    disabled={addingUser === user.id}
                    className="flex items-center gap-2 w-full rounded-lg border border-gray-200 px-3 py-2 hover:border-primary-200 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary-700">{getInitials(user.name)}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400">@{user.username}</p>
                    </div>
                    {addingUser === user.id ? (
                      <Loader2 size={12} className="animate-spin text-gray-400" />
                    ) : (
                      <UserPlus size={14} className="text-primary-700" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-700">{getInitials(member.name)}</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {member.name}
                      {member.id === currentUserId && <span className="text-gray-400 font-normal"> (tu)</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">@{member.username}</p>
                  </div>
                  {member.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removingUser === member.id}
                      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {removingUser === member.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leave group */}
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="flex items-center gap-2 w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {leaving ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            Paraseste grupul
          </button>
        </div>
      </div>
    </div>
  )
}
