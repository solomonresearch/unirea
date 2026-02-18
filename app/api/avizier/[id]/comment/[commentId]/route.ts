import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: comment } = await supabase
      .from('announcement_comments')
      .select('user_id')
      .eq('id', params.commentId)
      .eq('announcement_id', params.id)
      .is('deleted_at', null)
      .single()

    if (!comment) {
      return NextResponse.json({ error: 'Comentariul nu a fost gasit' }, { status: 404 })
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Nu poti sterge comentariul altcuiva' }, { status: 403 })
    }

    const { error } = await supabase
      .from('announcement_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.commentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
