import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { extractSlugs } from '@/lib/taxonomy'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('mentorship_profiles')
    .select('mentor_text, mentor_active, mentor_slugs, mentee_text, mentee_active, mentee_slugs')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ data: data ?? null })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { mentor_text, mentor_active, mentee_text, mentee_active } = body

  const { data: profile } = await supabase
    .from('profiles')
    .select('highschool')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Compute taxonomy slugs from free text on every save
  const mentor_slugs = extractSlugs(mentor_text ?? '')
  const mentee_slugs = extractSlugs(mentee_text ?? '')

  const { data, error } = await supabase
    .from('mentorship_profiles')
    .upsert(
      {
        user_id: user.id,
        highschool: profile.highschool,
        mentor_text: mentor_text ?? null,
        mentor_active: mentor_active ?? false,
        mentor_slugs,
        mentee_text: mentee_text ?? null,
        mentee_active: mentee_active ?? false,
        mentee_slugs,
      },
      { onConflict: 'user_id' }
    )
    .select('mentor_text, mentor_active, mentor_slugs, mentee_text, mentee_active, mentee_slugs')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
