import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const SCOPE_MAP: Record<string, string> = {
  clasa: 'class',
  promotie: 'promotion',
  liceu: 'school',
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, highschool, graduation_year, class')
      .eq('id', user.id)
      .single()

    if (!profile?.highschool) {
      return NextResponse.json({ error: 'Profilul nu are liceul setat' }, { status: 400 })
    }

    const url = new URL(request.url)
    const scopeParam = url.searchParams.get('scope') ?? 'promotie'
    const dbScope = SCOPE_MAP[scopeParam] ?? 'promotion'

    let query = supabase
      .from('carusel_posts')
      .select('id, caption, user_id, storage_path, created_at, profiles!user_id(name, username)')
      .eq('scope', dbScope)
      .eq('highschool', profile.highschool)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (dbScope === 'promotion' || dbScope === 'class') {
      if (!profile.graduation_year) {
        return NextResponse.json({ posts: [] })
      }
      query = query.eq('graduation_year', profile.graduation_year)
    }

    if (dbScope === 'class') {
      if (!profile.class) {
        return NextResponse.json({ posts: [] })
      }
      query = query.eq('class', profile.class)
    }

    const { data: rawPosts, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rawPosts || rawPosts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    const ids = rawPosts.map(p => p.id)

    const [likesRes, commentsRes] = await Promise.all([
      supabase.from('carusel_likes').select('post_id, user_id').in('post_id', ids),
      supabase
        .from('carusel_comments')
        .select('id, post_id, content, created_at, user_id, profiles!user_id(name, username)')
        .in('post_id', ids)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
    ])

    const likes = likesRes.data || []
    const comments = commentsRes.data || []

    const posts = rawPosts.map((p: any) => {
      const pLikes = likes.filter(l => l.post_id === p.id)
      const pComments = comments.filter(c => c.post_id === p.id)

      return {
        id: p.id,
        caption: p.caption,
        image_url: supabase.storage.from('carusel').getPublicUrl(p.storage_path).data.publicUrl,
        user_id: p.user_id,
        profiles: p.profiles,
        likes: pLikes.length,
        liked: pLikes.some(l => l.user_id === user.id),
        comments: pComments,
        created_at: p.created_at,
      }
    })

    return NextResponse.json({ posts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = (formData.get('caption') as string || '').trim()
    const scopeParam = (formData.get('scope') as string || 'promotie').trim()
    const dbScope = SCOPE_MAP[scopeParam] ?? 'promotion'

    if (!file) {
      return NextResponse.json({ error: 'Fisierul este obligatoriu' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Doar imagini JPEG, PNG sau WebP' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fisierul depaseste limita de 4MB' }, { status: 400 })
    }

    if (caption.length > 500) {
      return NextResponse.json({ error: 'Descrierea depaseste 500 caractere' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, highschool, graduation_year, class')
      .eq('id', user.id)
      .single()

    if (!profile?.highschool) {
      return NextResponse.json({ error: 'Profilul nu are liceul setat' }, { status: 400 })
    }

    if ((dbScope === 'promotion' || dbScope === 'class') && !profile.graduation_year) {
      return NextResponse.json({ error: 'Profilul nu are anul de absolvire setat' }, { status: 400 })
    }

    if (dbScope === 'class' && !profile.class) {
      return NextResponse.json({ error: 'Profilul nu are clasa setata' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`

    const storage = createServiceRoleClient()

    const { error: uploadError } = await storage.storage
      .from('carusel')
      .upload(storagePath, buffer, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = storage.storage.from('carusel').getPublicUrl(storagePath)

    const { data, error } = await supabase
      .from('carusel_posts')
      .insert({
        user_id: user.id,
        caption: caption || null,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        file_size: file.size,
        scope: dbScope,
        highschool: profile.highschool,
        graduation_year: dbScope !== 'school' ? profile.graduation_year : null,
        class: dbScope === 'class' ? profile.class : null,
      })
      .select('id, caption, user_id, created_at, profiles!user_id(name, username)')
      .single()

    if (error) {
      await storage.storage.from('carusel').remove([storagePath])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      caption: data.caption,
      image_url: urlData.publicUrl,
      user_id: data.user_id,
      profiles: (data as any).profiles,
      likes: 0,
      liked: false,
      comments: [],
      created_at: data.created_at,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
