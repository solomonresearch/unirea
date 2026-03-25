import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function publicImageUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/evenimente/${storagePath}`
}

const SCOPE_MAP: Record<string, string> = {
  clasa: 'class',
  promotie: 'promotion',
  liceu: 'school',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event, error } = await supabase
    .from('evenimente')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error || !event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [{ data: participantsData }, { data: commentsData }] = await Promise.all([
    supabase
      .from('eveniment_participanti')
      .select('user_id, profiles!user_id(id, name, avatar_url)')
      .eq('eveniment_id', params.id),
    supabase
      .from('eveniment_comentarii')
      .select('id, content, created_at, user_id, profiles!user_id(name, username, avatar_url)')
      .eq('eveniment_id', params.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ])

  const parts = participantsData || []
  const attending = parts.some(p => p.user_id === user.id)
  const participants = parts.map((p: any) => ({
    id: p.profiles.id,
    name: p.profiles.name,
    avatar_url: p.profiles.avatar_url,
  }))
  const comments = (commentsData || []).map((c: any) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    profiles: c.profiles,
  }))

  return NextResponse.json({
    event: {
      ...event,
      image_url: event.image_storage_path ? publicImageUrl(event.image_storage_path) : null,
      participant_count: parts.length,
      attending,
      top_participants: participants.slice(0, 3),
      participants,
      comments,
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: existing } = await supabase
    .from('evenimente')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = existing.user_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const updates: Record<string, any> = {}

  const title = (formData.get('title') as string)?.trim()
  if (title) updates.title = title

  const event_date = formData.get('event_date') as string
  if (event_date) {
    const today = new Date().toISOString().split('T')[0]
    if (event_date < today) return NextResponse.json({ error: 'Data evenimentului nu poate fi în trecut' }, { status: 400 })
    updates.event_date = event_date
  }

  const event_time = formData.get('event_time') as string
  if (event_time !== null) updates.event_time = event_time || null

  const location = formData.get('location') as string
  if (location !== null) updates.location = location?.trim() || null

  const description = formData.get('description') as string
  if (description !== null) updates.description = description?.trim() || null

  const scopeParam = formData.get('scope') as string
  if (scopeParam) updates.scope = SCOPE_MAP[scopeParam] || 'promotion'

  const file = formData.get('file') as File | null
  if (file && file.size > 0) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: 'Tip de fișier neacceptat' }, { status: 400 })
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imaginea depășește 4MB' }, { status: 400 })
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const serviceClient = createServiceRoleClient()

    if (existing.image_storage_path) {
      await serviceClient.storage.from('evenimente').remove([existing.image_storage_path])
    }

    const { error: uploadError } = await serviceClient.storage
      .from('evenimente')
      .upload(storagePath, arrayBuffer, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
    updates.image_storage_path = storagePath
  }

  const { data: updated, error } = await supabase
    .from('evenimente')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    event: {
      ...updated,
      image_url: updated.image_storage_path ? publicImageUrl(updated.image_storage_path) : null,
    }
  })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: existing } = await supabase
    .from('evenimente')
    .select('user_id, image_storage_path')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = existing.user_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (existing.image_storage_path) {
    const serviceClient = createServiceRoleClient()
    await serviceClient.storage.from('evenimente').remove([existing.image_storage_path])
  }

  await supabase
    .from('evenimente')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ ok: true })
}
