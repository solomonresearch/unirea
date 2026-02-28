import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { name, member_ids } = body as { name?: string; member_ids?: string[] }

    if (!name?.trim() || name.trim().length > 100) {
      return NextResponse.json({ error: 'Numele grupului este obligatoriu (max 100 caractere)' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()
    const invite_code = crypto.randomUUID().slice(0, 8)

    const { data: conversation, error: convError } = await serviceClient
      .from('conversations')
      .insert({
        name: name.trim(),
        is_group: true,
        invite_code,
        created_by: user.id,
      })
      .select('id, name, invite_code')
      .single()

    if (convError) {
      console.error('Group create error:', convError)
      return NextResponse.json({ error: convError.message }, { status: 500 })
    }

    const participants = [{ conversation_id: conversation.id, user_id: user.id }]

    if (member_ids && Array.isArray(member_ids)) {
      const uniqueIds = [...new Set(member_ids.filter(id => id !== user.id))]
      for (const id of uniqueIds) {
        participants.push({ conversation_id: conversation.id, user_id: id })
      }
    }

    const { error: partError } = await serviceClient
      .from('conversation_participants')
      .insert(participants)

    if (partError) {
      console.error('Participant insert error:', partError)
      return NextResponse.json({ error: partError.message }, { status: 500 })
    }

    return NextResponse.json(conversation, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
