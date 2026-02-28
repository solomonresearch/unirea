import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: post } = await supabase
      .from('carusel_posts')
      .select('user_id, storage_path')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Postarea nu a fost gasita' }, { status: 404 })
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: 'Nu poti sterge postarea altcuiva' }, { status: 403 })
    }

    const { error } = await supabase
      .from('carusel_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.storage.from('carusel').remove([post.storage_path])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
