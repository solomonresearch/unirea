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

export async function POST() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('schools')
    .update({ enabled: false })
    .eq('enabled', true)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ updated: data?.length ?? 0 })
}
