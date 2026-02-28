import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    // Use service role to look up by invite_code (user may not be participant yet)
    const serviceClient = createServiceRoleClient()

    const { data: conversation, error } = await serviceClient
      .from('conversations')
      .select('id, name')
      .eq('invite_code', params.code)
      .eq('is_group', true)
      .single()

    if (error || !conversation) {
      return NextResponse.json({ error: 'Link invalid sau expirat' }, { status: 404 })
    }

    const { count } = await serviceClient
      .from('conversation_participants')
      .select('user_id', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id)

    // Check if caller is already a member
    const { data: existing } = await serviceClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      conversation_id: conversation.id,
      name: conversation.name,
      member_count: count || 0,
      already_member: !!existing,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()

    const { data: conversation, error: convError } = await serviceClient
      .from('conversations')
      .select('id')
      .eq('invite_code', params.code)
      .eq('is_group', true)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Link invalid sau expirat' }, { status: 404 })
    }

    // Check if already a member
    const { data: existing } = await serviceClient
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversation.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ conversation_id: conversation.id, already_member: true })
    }

    // Add user as participant (use service role since user isn't in group yet)
    const { error } = await serviceClient
      .from('conversation_participants')
      .insert({ conversation_id: conversation.id, user_id: user.id })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversation_id: conversation.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
