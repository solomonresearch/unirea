import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/mesaje/start-dm
// Body: { targetUserId: string }
// Finds an existing 1-on-1 conversation between the authenticated user and
// targetUserId, or creates one. Returns { conversationId }.

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId } = await req.json()
  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
  }
  if (targetUserId === user.id) {
    return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 })
  }

  // Find all DM conversation IDs the current user is in
  const { data: myParticipations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (myParticipations?.length) {
    const myIds = myParticipations.map(p => p.conversation_id)

    // Filter to non-group conversations
    const { data: dmConvos } = await supabase
      .from('conversations')
      .select('id')
      .in('id', myIds)
      .eq('is_group', false)

    if (dmConvos?.length) {
      const dmIds = dmConvos.map(c => c.id)

      // Check if the target user is in any of those DMs
      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', dmIds)
        .limit(1)

      if (existing?.length) {
        return NextResponse.json({ conversationId: existing[0].conversation_id })
      }
    }
  }

  // No existing DM — create one
  const newId = crypto.randomUUID()
  const { error: convErr } = await supabase
    .from('conversations')
    .insert({ id: newId })

  if (convErr) return NextResponse.json({ error: convErr.message }, { status: 500 })

  const { error: partErr } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newId, user_id: user.id },
      { conversation_id: newId, user_id: targetUserId },
    ])

  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 })

  return NextResponse.json({ conversationId: newId }, { status: 201 })
}
