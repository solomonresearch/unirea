import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const filter = searchParams.get('filter') || 'all'
  const judet = searchParams.get('judet') || ''
  const localitate = searchParams.get('localitate') || ''
  const sort = searchParams.get('sort') || 'name'

  let query = supabase
    .from('schools')
    .select('id, denumire_lunga_unitate, localitate_unitate, judet_pj, enabled, request_count')

  if (search) {
    query = query.or(
      `denumire_lunga_unitate.ilike.%${search}%,localitate_unitate.ilike.%${search}%,judet_pj.ilike.%${search}%`
    )
  }

  if (filter === 'enabled') {
    query = query.eq('enabled', true)
  } else if (filter === 'disabled') {
    query = query.eq('enabled', false)
  }

  if (judet) query = query.eq('judet_pj', judet)
  if (localitate) query = query.eq('localitate_unitate', localitate)

  if (sort === 'requests') {
    query = query.order('request_count', { ascending: false }).order('denumire_lunga_unitate')
  } else {
    query = query.order('denumire_lunga_unitate')
  }

  const { data: schools, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get member counts per school
  const { data: memberCounts } = await supabase
    .from('profiles')
    .select('highschool')
    .not('highschool', 'is', null)

  const countMap: Record<string, number> = {}
  if (memberCounts) {
    for (const p of memberCounts) {
      if (p.highschool) {
        countMap[p.highschool] = (countMap[p.highschool] || 0) + 1
      }
    }
  }

  const result = (schools || []).map(s => ({
    ...s,
    member_count: countMap[s.denumire_lunga_unitate] || 0,
  }))

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, enabled } = await req.json()
  if (id === undefined || enabled === undefined) {
    return NextResponse.json({ error: 'id and enabled required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase
    .from('schools')
    .update({ enabled })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
