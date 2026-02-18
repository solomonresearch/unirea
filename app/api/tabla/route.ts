import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
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

    if (!profile?.highschool || !profile?.class) {
      return NextResponse.json({ error: 'Profilul nu are clasa setata' }, { status: 400 })
    }

    const { data: classmates } = await supabase
      .from('profiles')
      .select('id')
      .eq('highschool', profile.highschool)
      .eq('graduation_year', profile.graduation_year)
      .eq('class', profile.class)

    if (!classmates || classmates.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    const classmateIds = classmates.map(c => c.id)

    const { data: rawPosts, error } = await supabase
      .from('posts')
      .select('id, content, created_at, user_id, profiles(name, username)')
      .in('user_id', classmateIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rawPosts || rawPosts.length === 0) {
      return NextResponse.json({ posts: [] })
    }

    const postIds = rawPosts.map(p => p.id)

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('post_votes').select('post_id, vote, user_id').in('post_id', postIds),
      supabase.from('comments').select('id, post_id, content, created_at, user_id, profiles(name, username)').in('post_id', postIds).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const votes = votesRes.data || []
    const comments = commentsRes.data || []

    const posts = rawPosts.map((post: any) => {
      const postVotes = votes.filter(v => v.post_id === post.id)
      const postComments = comments.filter(c => c.post_id === post.id)
      const userVote = postVotes.find(v => v.user_id === user.id)

      return {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user_id: post.user_id,
        profiles: post.profiles,
        upvotes: postVotes.filter(v => v.vote === 1).length,
        downvotes: postVotes.filter(v => v.vote === -1).length,
        user_vote: userVote ? userVote.vote : null,
        comments: postComments,
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

    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Continutul este obligatoriu' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
      })
      .select('id, content, created_at, user_id, profiles(name, username)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
