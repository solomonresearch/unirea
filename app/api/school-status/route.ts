import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const highschool = searchParams.get('highschool')
  if (!highschool) return NextResponse.json({ error: 'highschool required' }, { status: 400 })

  const supabase = createServiceRoleClient()

  const [schoolResult, configResult] = await Promise.all([
    supabase
      .from('schools')
      .select('enabled, request_count')
      .eq('denumire_lunga_unitate', highschool)
      .single(),
    supabase
      .from('app_config')
      .select('value')
      .eq('key', 'thresh_enable_school')
      .single(),
  ])

  const school = schoolResult.data
  const threshold = parseInt(configResult.data?.value || '50')
  const waitingCount = school?.request_count ?? 0
  const enabled = school?.enabled ?? false

  return NextResponse.json({
    enabled,
    waitingCount,
    threshold,
    remaining: Math.max(0, threshold - waitingCount),
  })
}
