import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, any> = {}

  if (body.title !== undefined) {
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
    }
    updates.title = body.title.trim()
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  if (body.status !== undefined) {
    const validStatuses = ['todo', 'in_progress', 'done']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Status invalid' }, { status: 400 })
    }
    updates.status = body.status
  }

  if (body.position !== undefined) {
    updates.position = body.position
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nicio modificare' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('kanban_cards')
    .update(updates)
    .eq('id', params.id)
    .select('*, profiles:created_by(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Card negasit' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status,
    position: data.position,
    card_number: data.card_number,
    created_by: data.created_by,
    creator_name: (data as any).profiles?.name ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { error } = await supabase
    .from('kanban_cards')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
