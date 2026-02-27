import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/autentificare' || request.nextUrl.pathname === '/inregistrare')) {
    return NextResponse.redirect(new URL('/avizier', request.url))
  }

  // Protect authenticated routes — redirect unauthenticated users to login
  const protectedPaths = ['/profil', '/avizier', '/setari', '/cauta', '/cercuri', '/mesaje', '/harta', '/admin']
  if (!user && protectedPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'))) {
    return NextResponse.redirect(new URL('/autentificare', request.url))
  }

  return response
}

export const config = {
  matcher: ['/autentificare', '/inregistrare', '/resetare-parola', '/resetare-parola/:path*', '/profil', '/avizier', '/avizier/:path*', '/setari', '/cauta', '/cercuri', '/cercuri/:path*', '/mesaje', '/mesaje/:path*', '/harta', '/admin'],
}
