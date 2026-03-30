import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { extractSlugsFromProfile } from '@/lib/taxonomy'

// POST /api/mentorship/sync-profile-slugs
//
// Recomputes profile_slugs for the authenticated user from their current
// hobbies, domain, and profession fields in `profiles`.
// Called automatically after the user saves hobbies or career fields in /setari.

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('hobbies, domain, profession')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const profile_slugs = extractSlugsFromProfile(
    profile.hobbies   ?? [],
    profile.domain    ?? [],
    profile.profession ?? [],
  )

  const { error } = await supabase
    .from('mentorship_profiles')
    .update({ profile_slugs })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile_slugs })
}
