import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export interface MentorshipConnection {
  mentor_id: string
  mentor_name: string
  mentor_username: string
  mentee_id: string
  mentee_name: string
  mentee_username: string
  shared_slugs: string[]
  score: number
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: rows, error } = await supabase
    .from('mentorship_profiles')
    .select('user_id, highschool, mentor_active, mentor_slugs, mentee_active, mentee_slugs, profiles(name, username)')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = rows ?? []

  const mentors = all.filter(p => p.mentor_active && (p.mentor_slugs as string[])?.length > 0)
  const mentees = all.filter(p => p.mentee_active && (p.mentee_slugs as string[])?.length > 0)

  const connections: MentorshipConnection[] = []

  for (const mentor of mentors) {
    for (const mentee of mentees) {
      if (mentor.user_id === mentee.user_id) continue
      if (mentor.highschool !== mentee.highschool) continue

      const mSet = new Set(mentor.mentor_slugs as string[])
      const tSet = new Set(mentee.mentee_slugs as string[])
      const intersection = [...mSet].filter(s => tSet.has(s))

      if (intersection.length === 0) continue

      const union = new Set([...mSet, ...tSet])
      const score = intersection.length / union.size

      const mp = (mentor.profiles as unknown) as { name: string; username: string } | null
      const tp = (mentee.profiles as unknown) as { name: string; username: string } | null

      connections.push({
        mentor_id: mentor.user_id,
        mentor_name: mp?.name ?? '—',
        mentor_username: mp?.username ?? '',
        mentee_id: mentee.user_id,
        mentee_name: tp?.name ?? '—',
        mentee_username: tp?.username ?? '',
        shared_slugs: intersection,
        score,
      })
    }
  }

  connections.sort((a, b) => b.score - a.score)

  return NextResponse.json({ connections })
}
