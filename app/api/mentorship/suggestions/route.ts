import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
      .select('mentor_slugs, mentee_slugs, mentor_active, mentee_active')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const highschool = profileResult.data?.highschool
  if (!highschool) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const myMentorship = mentorshipResult.data

  // Determine which slug array we're searching with
  // - looking for mentors  → we're the mentee  → use our mentee_slugs to match mentor_slugs
  // - looking for mentees  → we're the mentor  → use our mentor_slugs to match mentee_slugs
  const seekerSlugs: string[] =
    forParam === 'mentors'
      ? (myMentorship?.mentee_slugs ?? [])
      : (myMentorship?.mentor_slugs ?? [])

  const offerRole = forParam === 'mentors' ? 'mentor' : 'mentee'

  const { data: suggestions, error } = await supabase.rpc('get_mentorship_suggestions', {
    p_user_id:      user.id,
    p_highschool:   highschool,
    p_seeker_slugs: seekerSlugs,
    p_offer_role:   offerRole,
    p_limit:        10,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ suggestions: suggestions ?? [] })
}
