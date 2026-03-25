import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: comment } = await supabase
    .from('eveniment_comentarii')
    .select('user_id')
    .eq('id', params.commentId)
    .eq('eveniment_id', params.id)
    .is('deleted_at', null)
    .single()

  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (comment.user_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('eveniment_comentarii')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.commentId)

  return NextResponse.json({ ok: true })
}
