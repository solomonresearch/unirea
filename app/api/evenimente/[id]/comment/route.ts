import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await request.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Conținut obligatoriu' }, { status: 400 })
  if (content.trim().length > 500) return NextResponse.json({ error: 'Maxim 500 de caractere' }, { status: 400 })

  const { data: comment, error } = await supabase
    .from('eveniment_comentarii')
    .insert({ eveniment_id: params.id, user_id: user.id, content: content.trim() })
    .select('id, content, created_at, user_id, profiles!user_id(name, username, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment }, { status: 201 })
}
