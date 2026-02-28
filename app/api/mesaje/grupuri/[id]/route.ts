import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('id, name, is_group, invite_code, created_by')
      .eq('id', params.id)
      .single()

    if (error || !conversation) {
      return NextResponse.json({ error: 'Conversatia nu a fost gasita' }, { status: 404 })
    }

    const { data: members } = await supabase
      .from('conversation_participants')
      .select('user_id, profiles(id, name, username, avatar_url)')
      .eq('conversation_id', params.id)

    return NextResponse.json({
      ...conversation,
      members: (members || []).map(m => m.profiles),
    })
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

    const body = await request.json()
    const { name } = body as { name?: string }

    if (!name?.trim() || name.trim().length > 100) {
      return NextResponse.json({ error: 'Numele grupului este obligatoriu (max 100 caractere)' }, { status: 400 })
    }

    const { error } = await supabase
      .from('conversations')
      .update({ name: name.trim() })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
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

    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
