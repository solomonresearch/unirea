import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

async function requireAdmin() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function DELETE() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Count profiles with feedback first
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, feedback')
    .not('feedback', 'eq', '[]')
    .not('feedback', 'is', null)

  const total = (profiles || []).reduce((sum, p) => {
    const entries = Array.isArray(p.feedback) ? p.feedback : []
    return sum + entries.length
  }, 0)

  const ids = (profiles || []).map(p => p.id)

  if (ids.length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update({ feedback: [] })
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, deleted: total })
}
