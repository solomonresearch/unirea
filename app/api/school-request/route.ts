import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { school_name, email, message } = await req.json()

  if (!school_name || !email) {
    return NextResponse.json({ error: 'school_name and email required' }, { status: 400 })
  }

  const service = createServiceRoleClient()

  const { error: insertError } = await service
    .from('school_requests')
    .insert({ school_name, requester_email: email, message: message || null })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

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
        content_preview: school_name,
      }))
    )
  }

  return NextResponse.json({ ok: true })
}
