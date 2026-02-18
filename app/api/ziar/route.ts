import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { VALID_CATEGORIES } from '@/lib/ziar-categories'
import crypto from 'crypto'

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const db = user ? supabase : createServiceRoleClient()

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    let query = db
      .from('ziar_posts')
      .select('*')
      .is('deleted_at', null)
      .gte('created_at', threeDaysAgo)
      .order('created_at', { ascending: false })

    const category = request.nextUrl.searchParams.get('category')
    if (category && VALID_CATEGORIES.includes(category)) {
      query = query.eq('category', category)
    }

    const county = request.nextUrl.searchParams.get('county')
    if (county) {
      query = query.eq('county', county)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Determine if requester can post (1 per week)
    let canPost = true
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    if (user) {
      const { count } = await db
        .from('ziar_posts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .gte('created_at', oneWeekAgo)

      if (count && count >= 1) canPost = false
    } else {
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
      const hashedIp = hashIP(ip)

      const { count } = await db
        .from('ziar_posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_ip', hashedIp)
        .gte('created_at', oneWeekAgo)

      if (count && count >= 1) canPost = false
    }

    const posts = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      city: row.city,
      county: row.county,
      country: row.country,
      category: row.category,
      links: row.links,
      created_by: row.created_by,
      author_name: row.author_name,
      created_at: row.created_at,
    }))

    return NextResponse.json({ posts, canPost })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const db = user ? supabase : createServiceRoleClient()

    const body = await request.json()
    const { title, body: postBody, category, links, city, county, country } = body

    // Validate title
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Titlul nu poate depasi 200 de caractere' }, { status: 400 })
    }

    // Validate body
    if (!postBody?.trim()) {
      return NextResponse.json({ error: 'Continutul este obligatoriu' }, { status: 400 })
    }
    if (postBody.trim().length > 2000) {
      return NextResponse.json({ error: 'Continutul nu poate depasi 2000 de caractere' }, { status: 400 })
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Categoria este invalida' }, { status: 400 })
    }

    // Validate links
    const validatedLinks: string[] = []
    if (links && Array.isArray(links)) {
      if (links.length > 5) {
        return NextResponse.json({ error: 'Maxim 5 linkuri' }, { status: 400 })
      }
      for (const link of links) {
        if (typeof link === 'string' && link.trim()) {
          try {
            new URL(link.trim())
            validatedLinks.push(link.trim())
          } catch {
            return NextResponse.json({ error: `Link invalid: ${link}` }, { status: 400 })
          }
        }
      }
    }

    // Rate limit: 1 post per week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    let authorName: string | null = null
    let authorIp: string | null = null
    let postCity = city?.trim() || null
    let postCounty = county?.trim() || null
    let postCountry = country?.trim() || 'Romania'

    if (user) {
      const { count } = await db
        .from('ziar_posts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .gte('created_at', oneWeekAgo)

      if (count && count >= 1) {
        return NextResponse.json({ error: 'Poti posta o singura data pe saptamana' }, { status: 429 })
      }

      // Get profile info
      const { data: profile } = await db
        .from('profiles')
        .select('name, city, county, country')
        .eq('id', user.id)
        .single()

      if (profile) {
        authorName = profile.name
        if (!postCity) postCity = profile.city
        if (!postCounty) postCounty = profile.county
        if (!postCountry || postCountry === 'Romania') postCountry = profile.country || 'Romania'
      }
    } else {
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
      authorIp = hashIP(ip)

      const { count } = await db
        .from('ziar_posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_ip', authorIp)
        .gte('created_at', oneWeekAgo)

      if (count && count >= 1) {
        return NextResponse.json({ error: 'Poti posta o singura data pe saptamana' }, { status: 429 })
      }

      authorName = 'Anonim'
    }

    const { data, error } = await db
      .from('ziar_posts')
      .insert({
        title: title.trim(),
        body: postBody.trim(),
        city: postCity,
        county: postCounty,
        country: postCountry,
        category,
        links: validatedLinks,
        created_by: user?.id ?? null,
        author_name: authorName,
        author_ip: authorIp,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      title: data.title,
      body: data.body,
      city: data.city,
      county: data.county,
      country: data.country,
      category: data.category,
      links: data.links,
      created_by: data.created_by,
      author_name: data.author_name,
      created_at: data.created_at,
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
