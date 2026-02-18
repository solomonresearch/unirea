import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { vote } = body

    if (![1, -1, 0].includes(vote)) {
      return NextResponse.json({ error: 'Vot invalid' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('post_votes')
      .select('vote')
      .eq('post_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (vote === 0) {
      if (existing) {
        await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', params.id)
          .eq('user_id', user.id)
      }
    } else if (existing) {
      if (existing.vote === vote) {
        await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', params.id)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('post_votes')
          .update({ vote })
          .eq('post_id', params.id)
          .eq('user_id', user.id)
      }
    } else {
      const { error } = await supabase
        .from('post_votes')
        .insert({ post_id: params.id, user_id: user.id, vote })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
