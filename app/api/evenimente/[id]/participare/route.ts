import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('eveniment_participanti')
    .select('eveniment_id')
    .eq('eveniment_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('eveniment_participanti')
      .delete()
      .eq('eveniment_id', params.id)
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true, attending: false })
  } else {
    await supabase
      .from('eveniment_participanti')
      .insert({ eveniment_id: params.id, user_id: user.id })

    return NextResponse.json({ ok: true, attending: true })
  }
}
