import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { user_ids } = body as { user_ids?: string[] }

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: 'user_ids este obligatoriu' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', params.id)

    const existingIds = new Set((existing || []).map(p => p.user_id))
    const newIds = user_ids.filter(id => !existingIds.has(id))

    if (newIds.length === 0) {
      return NextResponse.json({ ok: true, added: 0 })
    }

    const rows = newIds.map(uid => ({ conversation_id: params.id, user_id: uid }))
    const { error } = await supabase.from('conversation_participants').insert(rows)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, added: newIds.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id } = body as { user_id?: string }

    if (!user_id) {
      return NextResponse.json({ error: 'user_id este obligatoriu' }, { status: 400 })
    }

    // Use service role to delete another user's participation
    // RLS only allows deleting own row, but any group member can remove others
    const { createServiceRoleClient } = await import('@/lib/supabase-server')
    const serviceClient = createServiceRoleClient()

    const { error } = await serviceClient
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', params.id)
      .eq('user_id', user_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
