import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { getSessionVersion } from '@/lib/db'

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET)
const COOKIE = 'session'
const EXPIRES_IN = 7 * 24 * 60 * 60 * 1000 // 7 days ms

export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function decrypt(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] })
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId, sessionVersion = 1) {
  const expiresAt = new Date(Date.now() + EXPIRES_IN)
  const token = await encrypt({ userId, sessionVersion, expiresAt })
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession() {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null

  const payload = await decrypt(token)
  if (!payload?.userId) return null

  // Reject sessions issued before the user's last password reset/change —
  // lets us revoke stolen cookies without a server-side session store.
  const currentVersion = await getSessionVersion(payload.userId)
  if (currentVersion === null || payload.sessionVersion !== currentVersion) return null

  return payload
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
