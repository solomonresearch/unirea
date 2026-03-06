import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { processMentions } from '@/lib/mentions'

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, content } = body

    if (!conversation_id || !content?.trim()) {
      return NextResponse.json({ error: 'conversation_id si content sunt obligatorii' }, { status: 400 })
    }

    // Verify user is a participant
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'Nu esti participant in aceasta conversatie' }, { status: 403 })
    }

    // Check if this is the first message in the conversation
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversation_id)
      .is('deleted_at', null)

    const isFirstMessage = (count || 0) === 0

    // Insert the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        user_id: user.id,
        content: content.trim(),
      })
      .select('id, conversation_id, user_id, content, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Process @mentions
    await processMentions(supabase, user.id, content.trim(), 'mesaje', conversation_id)

    // If first message, notify other participants
    if (isFirstMessage) {
      const { data: others } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversation_id)
        .neq('user_id', user.id)

      if (others && others.length > 0) {
        const preview = content.trim().length > 100
          ? content.trim().slice(0, 100) + '...'
          : content.trim()

        const notifications = others.map(o => ({
          user_id: o.user_id,
          actor_id: user.id,
          type: 'message' as const,
          context: 'mesaje' as const,
          reference_id: conversation_id,
          content_preview: preview,
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }

    return NextResponse.json(message, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
