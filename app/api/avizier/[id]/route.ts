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

    const { data: announcement } = await supabase
      .from('announcements')
      .select('user_id')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single()

    if (!announcement) {
      return NextResponse.json({ error: 'Anuntul nu a fost gasit' }, { status: 404 })
    }

    if (announcement.user_id !== user.id) {
      return NextResponse.json({ error: 'Nu poti sterge anuntul altcuiva' }, { status: 403 })
    }

    const { error } = await supabase
      .from('announcements')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
