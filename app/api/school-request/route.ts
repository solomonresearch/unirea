import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { school_id, email, message } = await req.json()

  if (!school_id || !email) {
    return NextResponse.json({ error: 'school_id and email required' }, { status: 400 })
  }

  const service = createServiceRoleClient()

  // Fetch school name for notification preview
  const { data: school } = await service
    .from('schools')
    .select('denumire_lunga_unitate')
    .eq('id', school_id)
    .single()

  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  // Insert request
  const { error: insertError } = await service
    .from('school_requests')
    .insert({ school_id, requester_email: email, message: message || null })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Increment request_count on schools
  await service.rpc('increment_school_request_count', { p_school_id: school_id })

  // Notify all admins
  const { data: admins } = await service
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    await service.from('notifications').insert(
      admins.map(a => ({
        user_id: a.id,
        actor_id: null,
        type: 'school_request',
        context: 'config',
        content_preview: school.denumire_lunga_unitate,
      }))
    )
  }

  return NextResponse.json({ ok: true })
}
