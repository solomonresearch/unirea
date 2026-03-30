import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('mentorship_profiles')
    .select('mentor_text, mentor_active, mentee_text, mentee_active')
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

  const { data, error } = await supabase
    .from('mentorship_profiles')
    .upsert(
      {
        user_id: user.id,
        highschool: profile.highschool,
        mentor_text: mentor_text ?? null,
        mentor_active: mentor_active ?? false,
        mentee_text: mentee_text ?? null,
        mentee_active: mentee_active ?? false,
      },
      { onConflict: 'user_id' }
    )
    .select('mentor_text, mentor_active, mentee_text, mentee_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
