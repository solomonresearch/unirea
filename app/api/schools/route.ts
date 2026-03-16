import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const judet = searchParams.get('judet') || ''
  const localitate = searchParams.get('localitate') || ''

  if (!judet || !localitate) return NextResponse.json([])

  const service = createServiceRoleClient()
  const { data, error } = await service
    .from('schools')
    .select('id, denumire_lunga_unitate')
    .eq('judet_pj', judet)
    .eq('localitate_unitate', localitate)
    .order('denumire_lunga_unitate')

  if (error) return NextResponse.json([], { status: 500 })

  return NextResponse.json(
    (data || []).map(s => ({ id: s.id, name: s.denumire_lunga_unitate }))
  )
}
