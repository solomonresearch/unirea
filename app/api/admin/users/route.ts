import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

const VALID_ROLES = ['admin', 'moderator', 'user'] as const

async function getAdminProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    console.log('[admin] auth.getUser failed:', authError?.message || 'no user')
    return null
  }
  console.log('[admin] authenticated user:', user.id)

  const serviceClient = createServiceRoleClient()
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.log('[admin] profile query error:', profileError.message)
    return null
  }
  if (!profile || profile.role !== 'admin') {
    console.log('[admin] not admin, role:', profile?.role)
    return null
  }
  console.log('[admin] admin verified:', profile.id)
  return profile
}

export async function GET() {
  try {
    const admin = await getAdminProfile()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createServiceRoleClient()
    const { data: users, error } = await serviceClient
      .from('profiles')
      .select('id, name, username, email, role, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminProfile()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 })
    }

    if (userId === admin.id) {
      return NextResponse.json({ error: 'Nu îți poți schimba propriul rol' }, { status: 400 })
    }

    const serviceClient = createServiceRoleClient()
    const { error } = await serviceClient
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
