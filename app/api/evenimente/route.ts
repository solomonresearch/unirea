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

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('highschool, graduation_year, class')
    .eq('id', user.id)
    .single()

  if (!profile?.highschool) return NextResponse.json({ error: 'Profile incomplete' }, { status: 400 })

  const scopeParam = request.nextUrl.searchParams.get('scope') || 'promotie'
  const dbScope = SCOPE_MAP[scopeParam] || 'promotion'

  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('evenimente')
    .select('id, title, event_date, event_time, location, scope, image_storage_path, user_id, created_at')
    .is('deleted_at', null)
    .eq('highschool', profile.highschool)
    .gte('event_date', today)
    .order('event_date', { ascending: true })

  if (dbScope === 'class') {
    query = query.eq('scope', 'class').eq('graduation_year', profile.graduation_year).eq('class', profile.class)
  } else if (dbScope === 'promotion') {
    query = query.eq('scope', 'promotion').eq('graduation_year', profile.graduation_year)
  } else {
    query = query.eq('scope', 'school')
  }

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!rows || rows.length === 0) return NextResponse.json({ events: [] })

  const eventIds = rows.map(r => r.id)

  const { data: allParticipants } = await supabase
    .from('eveniment_participanti')
    .select('eveniment_id, user_id, profiles!user_id(id, name, avatar_url)')
    .in('eveniment_id', eventIds)

  const participants = allParticipants || []

  const events = rows.map(row => {
    const eventParts = participants.filter(p => p.eveniment_id === row.id)
    const attending = eventParts.some(p => p.user_id === user.id)
    const topParticipants = eventParts
      .filter((p: any) => p.profiles)
      .slice(0, 4)
      .map((p: any) => ({
        id: p.profiles.id,
        name: p.profiles.name,
        avatar_url: p.profiles.avatar_url,
      }))
    return {
      ...row,
      image_url: row.image_storage_path ? publicImageUrl(row.image_storage_path) : null,
      participant_count: eventParts.length,
      attending,
      top_participants: topParticipants,
    }
  })

  return NextResponse.json({ events })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('highschool, graduation_year, class, name, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile?.highschool) return NextResponse.json({ error: 'Profile incomplete' }, { status: 400 })

  const formData = await request.formData()
  const title = (formData.get('title') as string)?.trim()
  const event_date = formData.get('event_date') as string
  const event_time = (formData.get('event_time') as string) || null
  const location = (formData.get('location') as string)?.trim() || null
  const description = (formData.get('description') as string)?.trim() || null
  const scopeParam = formData.get('scope') as string
  const file = formData.get('file') as File | null

  if (!title) return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
  if (!event_date) return NextResponse.json({ error: 'Data este obligatorie' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]
  if (event_date < today) return NextResponse.json({ error: 'Data evenimentului nu poate fi în trecut' }, { status: 400 })

  const dbScope = SCOPE_MAP[scopeParam] || 'promotion'

  if (dbScope === 'class' && (!profile.graduation_year || !profile.class)) {
    return NextResponse.json({ error: 'Profilul incomplet pentru această vizibilitate' }, { status: 400 })
  }
  if (dbScope === 'promotion' && !profile.graduation_year) {
    return NextResponse.json({ error: 'Profilul incomplet pentru această vizibilitate' }, { status: 400 })
  }

  let image_storage_path: string | null = null

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
    const { error: uploadError } = await serviceClient.storage
      .from('evenimente')
      .upload(storagePath, arrayBuffer, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })
    image_storage_path = storagePath
  }

  const { data: created, error } = await supabase
    .from('evenimente')
    .insert({
      user_id: user.id,
      scope: dbScope,
      highschool: profile.highschool,
      graduation_year: dbScope !== 'school' ? profile.graduation_year : null,
      class: dbScope === 'class' ? profile.class : null,
      title,
      event_date,
      event_time: event_time || null,
      location,
      description,
      image_storage_path,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase
    .from('eveniment_participanti')
    .insert({ eveniment_id: created.id, user_id: user.id })

  return NextResponse.json({
    event: {
      ...created,
      image_url: created.image_storage_path ? publicImageUrl(created.image_storage_path) : null,
      participant_count: 1,
      attending: true,
      top_participants: [{ id: user.id, name: profile.name, avatar_url: profile.avatar_url }],
    }
  }, { status: 201 })
}
