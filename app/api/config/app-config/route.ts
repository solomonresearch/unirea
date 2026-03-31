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

  return NextResponse.json({
    thresh_enable_school:   parseInt(config['thresh_enable_school']   || '50'),
    max_mentor_suggestions: parseInt(config['max_mentor_suggestions'] || '10'),
    max_mentee_suggestions: parseInt(config['max_mentee_suggestions'] || '10'),
  })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { thresh_enable_school, max_mentor_suggestions, max_mentee_suggestions } = await req.json()

  if (thresh_enable_school !== undefined) {
    if (typeof thresh_enable_school !== 'number' || thresh_enable_school < 1) {
      return NextResponse.json({ error: 'thresh_enable_school must be a positive number' }, { status: 400 })
    }
  }
  if (max_mentor_suggestions !== undefined) {
    if (typeof max_mentor_suggestions !== 'number' || max_mentor_suggestions < 0 || max_mentor_suggestions > 10) {
      return NextResponse.json({ error: 'max_mentor_suggestions must be between 0 and 10' }, { status: 400 })
    }
  }
  if (max_mentee_suggestions !== undefined) {
    if (typeof max_mentee_suggestions !== 'number' || max_mentee_suggestions < 0 || max_mentee_suggestions > 10) {
      return NextResponse.json({ error: 'max_mentee_suggestions must be between 0 and 10' }, { status: 400 })
    }
  }

  const supabase = createServiceRoleClient()

  if (thresh_enable_school !== undefined) {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'thresh_enable_school', value: String(thresh_enable_school) })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (max_mentor_suggestions !== undefined) {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'max_mentor_suggestions', value: String(max_mentor_suggestions) })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (max_mentee_suggestions !== undefined) {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'max_mentee_suggestions', value: String(max_mentee_suggestions) })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-enable any schools that now meet the threshold (only when threshold was updated)
  let autoEnabled = 0
  if (thresh_enable_school !== undefined) {
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
      autoEnabled = schools.length
    }
  }

  return NextResponse.json({ ok: true, autoEnabled })
}
