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
      .select('id, highschool')
      .eq('id', user.id)
      .single()

    if (!profile?.highschool) {
      return NextResponse.json({ error: 'Profilul nu are liceul setat' }, { status: 400 })
    }

    const { data: rawAnnouncements, error } = await supabase
      .from('announcements')
      .select('id, content, created_at, expires_at, user_id, highschool, profiles(name, username)')
      .eq('highschool', profile.highschool)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rawAnnouncements || rawAnnouncements.length === 0) {
      return NextResponse.json({ announcements: [] })
    }

    const ids = rawAnnouncements.map(a => a.id)

    const [votesRes, commentsRes] = await Promise.all([
      supabase.from('announcement_votes').select('announcement_id, vote, user_id').in('announcement_id', ids),
      supabase.from('announcement_comments').select('id, announcement_id, content, created_at, user_id, profiles(name, username)').in('announcement_id', ids).is('deleted_at', null).order('created_at', { ascending: true }),
    ])

    const votes = votesRes.data || []
    const comments = commentsRes.data || []

    const announcements = rawAnnouncements.map((a: any) => {
      const aVotes = votes.filter(v => v.announcement_id === a.id)
      const aComments = comments.filter(c => c.announcement_id === a.id)
      const userVote = aVotes.find(v => v.user_id === user.id)

      return {
        id: a.id,
        content: a.content,
        created_at: a.created_at,
        expires_at: a.expires_at,
        user_id: a.user_id,
        profiles: a.profiles,
        upvotes: aVotes.filter(v => v.vote === 1).length,
        downvotes: aVotes.filter(v => v.vote === -1).length,
        user_vote: userVote ? userVote.vote : null,
        comments: aComments,
      }
    })

    announcements.sort((a: any, b: any) =>
      (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return NextResponse.json({ announcements })
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
      .select('id, highschool')
      .eq('id', user.id)
      .single()

    if (!profile?.highschool) {
      return NextResponse.json({ error: 'Profilul nu are liceul setat' }, { status: 400 })
    }

    const body = await request.json()
    const { content, expiry_days } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Continutul este obligatoriu' }, { status: 400 })
    }

    const validExpiry = [3, 7, 14]
    if (!validExpiry.includes(expiry_days)) {
      return NextResponse.json({ error: 'Durata de expirare invalida' }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiry_days)

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        user_id: user.id,
        highschool: profile.highschool,
        content: content.trim(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id, content, created_at, expires_at, user_id, profiles(name, username)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
