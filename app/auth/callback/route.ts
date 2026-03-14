import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const ref = searchParams.get('ref')

  if (code) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Google user without profile → complete registration
        const completeUrl = new URL('/completare-profil', req.url)
        if (ref) completeUrl.searchParams.set('ref', ref)
        return NextResponse.redirect(completeUrl)
      }
    }
  }

  return NextResponse.redirect(new URL('/avizier', req.url))
}
