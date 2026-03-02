import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
    }

    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, result_post_id, target_scope')
      .eq('id', params.id)
      .single()

    if (!quiz) {
      return NextResponse.json({ error: 'Sondajul nu a fost gasit' }, { status: 404 })
    }

    if (quiz.result_post_id) {
      const deletedAt = new Date().toISOString()
      if (quiz.target_scope === 'class') {
        await supabase.from('posts').update({ deleted_at: deletedAt }).eq('id', quiz.result_post_id)
      } else {
        await supabase.from('announcements').update({ deleted_at: deletedAt }).eq('id', quiz.result_post_id)
      }
    }

    await supabase.from('quiz_responses').delete().eq('quiz_id', params.id)

    const { error } = await supabase.from('quizzes').delete().eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'moderator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = ['active', 'expires_at', 'title', 'description', 'reveal_threshold']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
