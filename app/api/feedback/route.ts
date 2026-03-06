import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

interface FeedbackEntry {
  id: number
  msg: string
  at: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message } = await request.json()
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()

    const { data: profile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('feedback')
      .eq('id', user.id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const existing: FeedbackEntry[] = Array.isArray(profile?.feedback) ? profile.feedback : []
    const nextId = existing.length > 0 ? Math.max(...existing.map((e: FeedbackEntry) => e.id)) + 1 : 1
    const newEntry: FeedbackEntry = { id: nextId, msg: message.trim(), at: new Date().toISOString() }
    const updated = [...existing, newEntry]

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ feedback: updated })
      .eq('id', user.id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: nextId }, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceRoleClient()
    const { data: { user } } = await serviceClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: profiles, error } = await serviceClient
      .from('profiles')
      .select('id, name, username, feedback')
      .not('feedback', 'eq', '[]')
      .not('feedback', 'is', null)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const allFeedback = (profiles || []).flatMap(p => {
      const entries: FeedbackEntry[] = Array.isArray(p.feedback) ? p.feedback : []
      return entries.map(e => ({
        userId: p.id,
        userName: p.name,
        userUsername: p.username,
        feedbackId: e.id,
        message: e.msg,
        createdAt: e.at,
      }))
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ feedback: allFeedback })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceRoleClient()
    const { data: { user } } = await serviceClient.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, feedbackId } = await request.json()
    if (!userId || feedbackId == null) {
      return NextResponse.json({ error: 'userId and feedbackId required' }, { status: 400 })
    }

    const { data: targetProfile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('feedback')
      .eq('id', userId)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    const existing: FeedbackEntry[] = Array.isArray(targetProfile?.feedback) ? targetProfile.feedback : []
    const updated = existing.filter(e => e.id !== feedbackId)

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ feedback: updated })
      .eq('id', userId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
