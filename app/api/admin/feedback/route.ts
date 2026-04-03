import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'

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

  const allEntries = (profiles || []).flatMap(p =>
    Array.isArray(p.feedback) ? p.feedback : []
  ) as { id: number; screenshot_path?: string }[]

  const total = allEntries.length
  const screenshotPaths = allEntries.map(e => e.screenshot_path).filter(Boolean) as string[]

  const ids = (profiles || []).map(p => p.id)

  if (ids.length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update({ feedback: [] })
      .in('id', ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (screenshotPaths.length > 0) {
    const serviceClient = createServiceRoleClient()
    await serviceClient.storage.from('feedback').remove(screenshotPaths)
  }

  return NextResponse.json({ ok: true, deleted: total })
}
