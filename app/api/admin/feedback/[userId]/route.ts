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

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { feedbackId } = await req.json()
  if (typeof feedbackId !== 'number') {
    return NextResponse.json({ error: 'feedbackId required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('feedback')
    .eq('id', params.userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const entries: { id: number; msg: string; at: string; page?: string; category?: string }[] =
    Array.isArray(profile.feedback) ? profile.feedback : []
  const updated = entries.filter(e => e.id !== feedbackId)

  const { error } = await supabase
    .from('profiles')
    .update({ feedback: updated })
    .eq('id', params.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
