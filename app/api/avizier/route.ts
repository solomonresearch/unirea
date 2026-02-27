import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

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
    const scopeParam = url.searchParams.get('scope') ?? 'liceu'
    const dbScope = SCOPE_MAP[scopeParam] ?? 'school'

    let query = supabase
      .from('avizier_posts')
      .select('id, content, created_at, expires_at, user_id, scope, profiles!user_id(name, username)')
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

    if (dbScope === 'school') {
      query = query.gt('expires_at', new Date().toISOString())
    }

    const { data: rawPosts, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rawPosts || rawPosts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    const ids = rawPosts.map(p => p.id)

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('avizier_post_votes').select('post_id, vote, user_id').in('post_id', ids),
      supabase.from('avizier_post_comments').select('id, post_id, content, created_at, user_id, profiles!user_id(name, username)').in('post_id', ids).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const votes = votesRes.data || []
    const comments = commentsRes.data || []

    const posts = rawPosts.map((p: any) => {
      const pVotes = votes.filter(v => v.post_id === p.id)
      const pComments = comments.filter(c => c.post_id === p.id)
      const userVote = pVotes.find(v => v.user_id === user.id)

      return {
        id: p.id,
        content: p.content,
        created_at: p.created_at,
        expires_at: p.expires_at,
        user_id: p.user_id,
        profiles: p.profiles,
        upvotes: pVotes.filter(v => v.vote === 1).length,
        downvotes: pVotes.filter(v => v.vote === -1).length,
        user_vote: userVote ? userVote.vote : null,
        comments: pComments,
      }
    })

    posts.sort((a: any, b: any) =>
      (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, highschool, graduation_year, class')
      .eq('id', user.id)
      .single()

    if (!profile?.highschool) {
      return NextResponse.json({ error: 'Profilul nu are liceul setat' }, { status: 400 })
    }

    const body = await request.json()
    const { content, scope: scopeParam, expiry_days } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Continutul este obligatoriu' }, { status: 400 })
    }

    const dbScope = SCOPE_MAP[scopeParam] ?? 'school'

    if ((dbScope === 'promotion' || dbScope === 'class') && !profile.graduation_year) {
      return NextResponse.json({ error: 'Profilul nu are anul de absolvire setat' }, { status: 400 })
    }

    if (dbScope === 'class' && !profile.class) {
      return NextResponse.json({ error: 'Profilul nu are clasa setata' }, { status: 400 })
    }

    let expiresAt: string | null = null
    if (dbScope === 'school') {
      const validExpiry = [3, 7, 14]
      if (!validExpiry.includes(expiry_days)) {
        return NextResponse.json({ error: 'Durata de expirare invalida' }, { status: 400 })
      }
      const d = new Date()
      d.setDate(d.getDate() + expiry_days)
      expiresAt = d.toISOString()
    }

    const { data, error } = await supabase
      .from('avizier_posts')
      .insert({
        user_id: user.id,
        scope: dbScope,
        highschool: profile.highschool,
        graduation_year: dbScope !== 'school' ? profile.graduation_year : null,
        class: dbScope === 'class' ? profile.class : null,
        content: content.trim(),
        expires_at: expiresAt,
      })
      .select('id, content, created_at, expires_at, user_id, scope, profiles!user_id(name, username)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
