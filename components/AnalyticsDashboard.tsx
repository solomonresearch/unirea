'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

interface PageStat { page: string; views: number }
interface UserStat { user_id: string; name: string; username: string; count: number }
interface DayStat { date: string; users: number }
interface ActionStat { target: string; count: number }

type TimeRange = '7d' | '30d' | '90d'

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState<TimeRange>('30d')
  const [topPages, setTopPages] = useState<PageStat[]>([])
  const [dau, setDau] = useState<DayStat[]>([])
  const [topUsers, setTopUsers] = useState<UserStat[]>([])
  const [actions, setActions] = useState<ActionStat[]>([])
  const [totalEvents, setTotalEvents] = useState(0)
  const [uniqueUsers, setUniqueUsers] = useState(0)

  useEffect(() => { loadAnalytics() }, [range])

  async function loadAnalytics() {
    setLoading(true)
    const supabase = getSupabase()
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, page, target, user_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000)

    if (!events) { setLoading(false); return }

    setTotalEvents(events.length)
    setUniqueUsers(new Set(events.map(e => e.user_id)).size)

    // Top pages
    const pageCounts: Record<string, number> = {}
    for (const e of events) {
      if (e.event_type === 'page_view' && e.page) {
        pageCounts[e.page] = (pageCounts[e.page] || 0) + 1
      }
    }
    setTopPages(
      Object.entries(pageCounts)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15)
    )

    // DAU
    const dayUsers: Record<string, Set<string>> = {}
    for (const e of events) {
      const day = e.created_at.slice(0, 10)
      if (!dayUsers[day]) dayUsers[day] = new Set()
      dayUsers[day].add(e.user_id)
    }
    setDau(
      Object.entries(dayUsers)
        .map(([date, users]) => ({ date, users: users.size }))
        .sort((a, b) => a.date.localeCompare(b.date))
    )

    // Top users
    const userCounts: Record<string, number> = {}
    for (const e of events) {
      userCounts[e.user_id] = (userCounts[e.user_id] || 0) + 1
    }
    const topUserIds = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    if (topUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username')
        .in('id', topUserIds.map(([id]) => id))

      const profileMap = new Map((profiles || []).map(p => [p.id, p]))
      setTopUsers(
        topUserIds.map(([id, count]) => {
          const p = profileMap.get(id)
          return { user_id: id, name: p?.name || '?', username: p?.username || '?', count }
        })
      )
    }

    // Action breakdown
    const actionCounts: Record<string, number> = {}
    for (const e of events) {
      if (e.event_type === 'click' && e.target) {
        actionCounts[e.target] = (actionCounts[e.target] || 0) + 1
      }
    }
    setActions(
      Object.entries(actionCounts)
        .map(([target, count]) => ({ target, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
    )

    setLoading(false)
  }

  const maxPageViews = topPages.length > 0 ? topPages[0].views : 1
  const maxDau = dau.length > 0 ? Math.max(...dau.map(d => d.users)) : 1
  const maxUserCount = topUsers.length > 0 ? topUsers[0].count : 1
  const maxActionCount = actions.length > 0 ? actions[0].count : 1

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin" style={{ color: 'var(--ink3)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Time range picker */}
      <div className="flex gap-1">
        {(['7d', '30d', '90d'] as TimeRange[]).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className="rounded-md px-3 py-1 text-xxs font-semibold transition-colors"
            style={range === r
              ? { background: 'var(--ink)', color: 'var(--white)' }
              : { background: 'var(--cream2)', color: 'var(--ink3)' }
            }
          >
            {r === '7d' ? '7 zile' : r === '30d' ? '30 zile' : '90 zile'}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg px-3 py-2" style={{ background: 'var(--cream2)' }}>
          <p className="text-2xs uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Evenimente</p>
          <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{totalEvents.toLocaleString()}</p>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'var(--cream2)' }}>
          <p className="text-2xs uppercase tracking-wider" style={{ color: 'var(--ink3)' }}>Utilizatori unici</p>
          <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>{uniqueUsers}</p>
        </div>
      </div>

      {/* DAU chart */}
      {dau.length > 0 && (
        <div>
          <p className="text-xxs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ink3)' }}>
            Utilizatori activi zilnic
          </p>
          <div className="flex items-end gap-px h-20 rounded-lg overflow-hidden px-1" style={{ background: 'var(--cream2)' }}>
            {dau.map(d => (
              <div
                key={d.date}
                className="flex-1 min-w-[3px] rounded-t-sm transition-all"
                style={{
                  height: `${Math.max((d.users / maxDau) * 100, 4)}%`,
                  background: 'var(--teal)',
                }}
                title={`${d.date}: ${d.users} utilizatori`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-2xs" style={{ color: 'var(--ink3)' }}>{dau[0]?.date.slice(5)}</span>
            <span className="text-2xs" style={{ color: 'var(--ink3)' }}>{dau[dau.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Top pages */}
      {topPages.length > 0 && (
        <div>
          <p className="text-xxs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ink3)' }}>
            Pagini populare
          </p>
          <div className="space-y-1">
            {topPages.map(p => (
              <div key={p.page} className="flex items-center gap-2">
                <span className="text-xxs font-mono w-24 truncate flex-shrink-0" style={{ color: 'var(--ink2)' }}>
                  {p.page}
                </span>
                <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: 'var(--cream2)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${(p.views / maxPageViews) * 100}%`, background: 'var(--amber)' }}
                  />
                </div>
                <span className="text-xxs font-bold w-8 text-right" style={{ color: 'var(--ink3)' }}>
                  {p.views}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top users */}
      {topUsers.length > 0 && (
        <div>
          <p className="text-xxs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ink3)' }}>
            Utilizatori activi
          </p>
          <div className="space-y-1">
            {topUsers.map(u => (
              <div key={u.user_id} className="flex items-center gap-2">
                <span className="text-xxs w-24 truncate flex-shrink-0" style={{ color: 'var(--ink2)' }}>
                  <span className="font-semibold">{u.name}</span>
                </span>
                <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: 'var(--cream2)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${(u.count / maxUserCount) * 100}%`, background: '#7B6D9E' }}
                  />
                </div>
                <span className="text-xxs font-bold w-8 text-right" style={{ color: 'var(--ink3)' }}>
                  {u.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action breakdown */}
      {actions.length > 0 && (
        <div>
          <p className="text-xxs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ink3)' }}>
            Acțiuni
          </p>
          <div className="space-y-1">
            {actions.map(a => (
              <div key={a.target} className="flex items-center gap-2">
                <span className="text-xxs w-24 truncate flex-shrink-0" style={{ color: 'var(--ink2)' }}>
                  {a.target}
                </span>
                <div className="flex-1 h-4 rounded-sm overflow-hidden" style={{ background: 'var(--cream2)' }}>
                  <div
                    className="h-full rounded-sm"
                    style={{ width: `${(a.count / maxActionCount) * 100}%`, background: '#5B8E6D' }}
                  />
                </div>
                <span className="text-xxs font-bold w-8 text-right" style={{ color: 'var(--ink3)' }}>
                  {a.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalEvents === 0 && (
        <p className="text-center text-xs py-4" style={{ color: 'var(--ink3)' }}>
          Nicio dată încă
        </p>
      )}
    </div>
  )
}
