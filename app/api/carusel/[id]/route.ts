import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: post, error } = await supabase
      .from('carusel_posts')
      .select('id, caption, user_id, storage_path, created_at, profiles!user_id(name, username)')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Postarea nu a fost gasita' }, { status: 404 })
    }

    const [likesRes, commentsRes] = await Promise.all([
      supabase.from('carusel_likes').select('user_id').eq('post_id', post.id),
      supabase
        .from('carusel_comments')
        .select('id, post_id, content, created_at, user_id, profiles!user_id(name, username)')
        .eq('post_id', post.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
    ])

    const likes = likesRes.data || []
    const comments = commentsRes.data || []

    return NextResponse.json({
      id: post.id,
      caption: post.caption,
      image_url: supabase.storage.from('carusel').getPublicUrl((post as any).storage_path).data.publicUrl,
      user_id: post.user_id,
      profiles: (post as any).profiles,
      likes: likes.length,
      liked: likes.some(l => l.user_id === user.id),
      comments,
      created_at: post.created_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: post } = await supabase
      .from('carusel_posts')
      .select('user_id, storage_path')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single()

    if (!post) {
      return NextResponse.json({ error: 'Postarea nu a fost gasita' }, { status: 404 })
    }

    if (post.user_id !== user.id) {
      return NextResponse.json({ error: 'Nu poti sterge postarea altcuiva' }, { status: 403 })
    }

    const { error } = await supabase
      .from('carusel_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await createServiceRoleClient().storage.from('carusel').remove([post.storage_path])

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
