import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = user ? supabase : createServiceRoleClient()

  const { data, error } = await db
    .from('kanban_cards')
    .select('*, profiles:created_by(name)')
    .order('position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cards = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    position: row.position,
    card_number: row.card_number,
    created_by: row.created_by,
    creator_name: row.profiles?.name ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  return NextResponse.json(cards)
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const db = user ? supabase : createServiceRoleClient()

  const body = await request.json()
  const { title, description, status } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
  }

  const validStatuses = ['todo', 'in_progress', 'done']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status invalid' }, { status: 400 })
  }

  // Get the next position for this column
  const { data: existing } = await db
    .from('kanban_cards')
    .select('position')
    .eq('status', status)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data, error } = await db
    .from('kanban_cards')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      status,
      position: nextPosition,
      created_by: user?.id ?? null,
    })
    .select('*, profiles:created_by(name)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
  }, { status: 201 })
}
