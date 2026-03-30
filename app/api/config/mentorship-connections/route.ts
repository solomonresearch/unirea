import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMatchingKeywords } from '@/lib/taxonomy'

export interface SlugDetail {
  slug: string
  mentorKeywords: string[]
  menteeKeywords: string[]
}

export interface MentorshipConnection {
  mentor_id: string
  mentor_name: string
  mentor_username: string
  mentee_id: string
  mentee_name: string
  mentee_username: string
  slug_details: SlugDetail[]
  score: number
}

type ProfileRow = {
  name: string
  username: string
  hobbies: string[] | null
  domain: string[] | null
  profession: string[] | null
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
    .select(`
      user_id, highschool,
      mentor_active, mentor_slugs, mentor_text,
      mentee_active, mentee_slugs, mentee_text,
      profile_slugs,
      profiles(name, username, hobbies, domain, profession)
    `)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = rows ?? []

  const mentors = all.filter(p => p.mentor_active)
  const mentees = all.filter(p => p.mentee_active)

  const connections: MentorshipConnection[] = []

  for (const mentor of mentors) {
    for (const mentee of mentees) {
      if (mentor.user_id === mentee.user_id) continue
      if (mentor.highschool !== mentee.highschool) continue

      const mSet = new Set([
        ...(mentor.mentor_slugs as string[] ?? []),
        ...(mentor.profile_slugs as string[] ?? []),
      ])
      const tSet = new Set([
        ...(mentee.mentee_slugs as string[] ?? []),
        ...(mentee.profile_slugs as string[] ?? []),
      ])
      const intersection = [...mSet].filter(s => tSet.has(s))

      // Seeker coverage: what fraction of the mentee's needs does this mentor cover?
      const score = tSet.size > 0 ? intersection.length / tSet.size : 0

      const mp = (mentor.profiles as unknown) as ProfileRow | null
      const tp = (mentee.profiles as unknown) as ProfileRow | null

      // Build the text corpus for each side (free text + profile labels)
      const mentorCorpus = [
        mentor.mentor_text ?? '',
        ...(mp?.hobbies ?? []),
        ...(mp?.domain ?? []),
        ...(mp?.profession ?? []),
      ].join(' ')

      const menteeCorpus = [
        mentee.mentee_text ?? '',
        ...(tp?.hobbies ?? []),
        ...(tp?.domain ?? []),
        ...(tp?.profession ?? []),
      ].join(' ')

      const slug_details: SlugDetail[] = intersection.map(slug => ({
        slug,
        mentorKeywords: getMatchingKeywords(slug, mentorCorpus),
        menteeKeywords: getMatchingKeywords(slug, menteeCorpus),
      }))

      connections.push({
        mentor_id: mentor.user_id,
        mentor_name: mp?.name ?? '—',
        mentor_username: mp?.username ?? '',
        mentee_id: mentee.user_id,
        mentee_name: tp?.name ?? '—',
        mentee_username: tp?.username ?? '',
        slug_details,
        score,
      })
    }
  }

  connections.sort((a, b) => b.score - a.score)

  return NextResponse.json({ connections })
}
