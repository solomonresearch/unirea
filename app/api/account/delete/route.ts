import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.confirmation !== 'sterge') {
    return NextResponse.json({ error: 'Invalid confirmation' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Generate archived username: zzz + original username
  let archivedUsername = `zzz${profile.username}`

  // Check for collision
  const { data: collision } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', archivedUsername)
    .neq('id', user.id)
    .limit(1)

  if (collision && collision.length > 0) {
    const suffix = Math.floor(100 + Math.random() * 900) // 3-digit random
    archivedUsername = `zzz${profile.username}${suffix}`
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      archived_at: new Date().toISOString(),
      username: archivedUsername,
    })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
