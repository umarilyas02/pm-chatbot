import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PAGES = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/accept-invite',
])

function isPublic(pathname) {
  if (PUBLIC_PAGES.has(pathname)) return true
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
    if (PUBLIC_PAGES.has(pathname)) {
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
