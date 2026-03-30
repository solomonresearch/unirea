import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMatchingKeywords } from '@/lib/taxonomy'

// GET /api/mentorship/suggestions?for=mentors|mentees
//
// Returns ranked mentorship suggestions for the authenticated user.
//   ?for=mentors  → current user is a mentee; find available mentors
//   ?for=mentees  → current user is a mentor; find mentees seeking help
//
// Scoring: Jaccard overlap of taxonomy slugs via score_mentorship_match()
// Scope: same highschool only

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const forParam = req.nextUrl.searchParams.get('for') // 'mentors' | 'mentees'
  if (forParam !== 'mentors' && forParam !== 'mentees') {
    return NextResponse.json({ error: 'Missing ?for=mentors|mentees' }, { status: 400 })
  }

  // Fetch current user's profile + mentorship data in parallel
  const [profileResult, mentorshipResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('highschool')
      .eq('id', user.id)
      .single(),
    supabase
      .from('mentorship_profiles')
      .select('mentor_slugs, mentee_slugs, mentor_active, mentee_active, profile_slugs')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const highschool = profileResult.data?.highschool
  if (!highschool) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const myMentorship = mentorshipResult.data

  // Determine which slug array we're searching with, always union with profile_slugs
  // so the seeker side is computed identically to how Conexiuni computes it.
  // - looking for mentors  → we're the mentee  → use mentee_slugs ∪ profile_slugs
  // - looking for mentees  → we're the mentor  → use mentor_slugs ∪ profile_slugs
  const textSlugs: string[] =
    forParam === 'mentors'
      ? (myMentorship?.mentee_slugs ?? [])
      : (myMentorship?.mentor_slugs ?? [])

  const seekerSlugs: string[] = [
    ...new Set([...textSlugs, ...(myMentorship?.profile_slugs ?? [])]),
  ]

  const offerRole = forParam === 'mentors' ? 'mentor' : 'mentee'

  const { data: suggestions, error } = await supabase.rpc('get_mentorship_suggestions', {
    p_user_id:      user.id,
    p_highschool:   highschool,
    p_seeker_slugs: seekerSlugs,
    p_offer_role:   offerRole,
    p_limit:        10,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!suggestions?.length) return NextResponse.json({ suggestions: [] })

  // Fetch slugs + text + profile fields for each suggested user
  const suggestedIds = suggestions.map((s: { user_id: string }) => s.user_id)
  const { data: slugRows } = await supabase
    .from('mentorship_profiles')
    .select('user_id, mentor_slugs, mentor_text, mentee_slugs, mentee_text, profile_slugs, profiles(hobbies, domain, profession)')
    .in('user_id', suggestedIds)

  const candidateMap = new Map(
    (slugRows ?? []).map(r => {
      const p = (r.profiles as unknown) as { hobbies?: string[]; domain?: string[]; profession?: string[] } | null
      const profileText = [...(p?.hobbies ?? []), ...(p?.domain ?? []), ...(p?.profession ?? [])].join(' ')
      return [r.user_id, {
        effectiveSlugs: {
          mentor: [...new Set([...(r.mentor_slugs ?? []), ...(r.profile_slugs ?? [])])],
          mentee: [...new Set([...(r.mentee_slugs ?? []), ...(r.profile_slugs ?? [])])],
        },
        corpus: {
          mentor: [r.mentor_text ?? '', profileText].join(' '),
          mentee: [r.mentee_text ?? '', profileText].join(' '),
        },
      }]
    })
  )

  const seekerSet = new Set(seekerSlugs)
  const offerKey = offerRole === 'mentor' ? 'mentor' : 'mentee'

  const enriched = suggestions.map((s: { user_id: string }) => {
    const candidate = candidateMap.get(s.user_id)
    const sharedSlugs = (candidate?.effectiveSlugs[offerKey] ?? []).filter(slug => seekerSet.has(slug))
    const slug_details = sharedSlugs.map(slug => ({
      slug,
      keywords: getMatchingKeywords(slug, candidate?.corpus[offerKey] ?? ''),
    }))
    return { ...s, slug_details }
  })

  return NextResponse.json({ suggestions: enriched })
}
