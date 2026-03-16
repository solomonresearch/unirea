import { NextRequest, NextResponse } from 'next/server'
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

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('app_config')
    .select('key, value')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const config: Record<string, string> = {}
  for (const row of data || []) config[row.key] = row.value

  return NextResponse.json({ thresh_enable_school: parseInt(config['thresh_enable_school'] || '50') })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { thresh_enable_school } = await req.json()
  if (typeof thresh_enable_school !== 'number' || thresh_enable_school < 1) {
    return NextResponse.json({ error: 'thresh_enable_school must be a positive number' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Update threshold
  const { error } = await supabase
    .from('app_config')
    .upsert({ key: 'thresh_enable_school', value: String(thresh_enable_school) })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-enable any schools that now meet the threshold
  const { data: schools } = await supabase
    .from('schools')
    .select('id, request_count')
    .eq('enabled', false)
    .gte('request_count', thresh_enable_school)

  if (schools && schools.length > 0) {
    await supabase
      .from('schools')
      .update({ enabled: true })
      .in('id', schools.map(s => s.id))
  }

  return NextResponse.json({ ok: true, autoEnabled: schools?.length ?? 0 })
}
