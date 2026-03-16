import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { highschool } = await req.json()
  if (!highschool) return NextResponse.json({ error: 'highschool required' }, { status: 400 })

  const supabase = createServiceRoleClient()

  // Get threshold
  const { data: configRow } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'thresh_enable_school')
    .single()
  const threshold = parseInt(configRow?.value || '50')

  // Get current school state
  const { data: school } = await supabase
    .from('schools')
    .select('id, enabled, request_count')
    .eq('denumire_lunga_unitate', highschool)
    .single()

  if (!school) return NextResponse.json({ error: 'school not found' }, { status: 404 })

  // Already enabled — nothing to do
  if (school.enabled) {
    return NextResponse.json({ enabled: true, waitingCount: school.request_count, threshold })
  }

  // Increment request_count
  const newCount = school.request_count + 1
  const shouldEnable = newCount >= threshold

  const { error } = await supabase
    .from('schools')
    .update({
      request_count: newCount,
      ...(shouldEnable ? { enabled: true } : {}),
    })
    .eq('id', school.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ enabled: shouldEnable, waitingCount: newCount, threshold })
}
