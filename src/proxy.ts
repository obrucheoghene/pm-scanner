import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Organizer-only routes: /events and /
  if (pathname.startsWith('/events') || pathname === '/') {
    if (!user || user.email !== process.env.ORGANIZER_EMAIL) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Scanner-only route: /scan
  if (pathname.startsWith('/scan')) {
    if (!user) {
      return NextResponse.redirect(new URL('/scanner-login', request.url))
    }
    // Further event-scoping happens inside the /scan page itself
  }

  return response
}

export const config = {
  matcher: ['/', '/events/:path*', '/scan/:path*'],
}
