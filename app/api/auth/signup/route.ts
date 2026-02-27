import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { email, password, name, username, phone, highschool, graduation_year, class: cls } = await request.json()

    if (!email || !password || !name || !username || !highschool || !graduation_year) {
      return NextResponse.json({ error: 'Campuri obligatorii lipsa' }, { status: 400 })
    }

    const service = createServiceRoleClient()

    const { data: authData, error: authError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    if (!authData.user) return NextResponse.json({ error: 'Eroare la crearea contului' }, { status: 500 })

    const { error: profileError } = await service.from('profiles').insert({
      id: authData.user.id,
      name,
      username,
      email,
      phone: phone || null,
      highschool,
      graduation_year: parseInt(graduation_year),
      class: cls,
    })

    if (profileError) {
      await service.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
