import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

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

export async function createSession(userId) {
  const expiresAt = new Date(Date.now() + EXPIRES_IN)
  const token = await encrypt({ userId, expiresAt })
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
  return decrypt(token)
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
