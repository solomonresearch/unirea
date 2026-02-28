import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('carusel_likes')
      .select('post_id')
      .eq('post_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      await supabase
        .from('carusel_likes')
        .delete()
        .eq('post_id', params.id)
        .eq('user_id', user.id)

      return NextResponse.json({ ok: true, liked: false })
    }

    const { error } = await supabase
      .from('carusel_likes')
      .insert({ post_id: params.id, user_id: user.id })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, liked: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
