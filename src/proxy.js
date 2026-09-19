import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// Pages that redirect an already-authenticated visitor straight to /dashboard —
// there's nothing for a logged-in user to do on a login/register/reset screen.
const REDIRECT_IF_AUTHENTICATED = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
])

// Public pages that stay reachable regardless of auth state. /accept-invite in
// particular MUST stay reachable while logged in — accepting an invite as the
// currently signed-in user is the normal case, not an edge case.
const PUBLIC_PAGES = new Set([
  ...REDIRECT_IF_AUTHENTICATED,
  '/verify-email',
  '/accept-invite',
])

// Generated metadata assets — favicons, the OG/Twitter card image, and the PWA
// manifest. These must be reachable with no session: browsers fetch them for
// every visitor (logged in or not) and social-media link-preview crawlers
// never carry a session cookie at all. Without this, the site's favicon breaks
// for anyone before they log in and link previews on Slack/Twitter/etc. fail.
const PUBLIC_ASSETS = new Set(['/icon', '/apple-icon', '/opengraph-image', '/manifest.json'])

function isPublic(pathname) {
  if (PUBLIC_PAGES.has(pathname)) return true
  if (PUBLIC_ASSETS.has(pathname)) return true
  if (pathname.startsWith('/api/health')) return true
  if (pathname.startsWith('/api/auth/')) return true
  return false
}

async function getSession(request) {
  const token = request.cookies.get('session')?.value
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    if (REDIRECT_IF_AUTHENTICATED.has(pathname)) {
      const session = await getSession(request)
      if (session) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  const session = await getSession(request)
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
}
