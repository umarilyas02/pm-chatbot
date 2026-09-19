'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import {
  createUser,
  findUserByEmail,
  setVerificationToken,
  verifyEmailToken,
  findUserByVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
  createWorkspace,
  countWorkspaces,
  bumpSessionVersion,
} from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'
import { sendVerificationEmail, sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/ratelimit'

// ── Schemas ──────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

// ── Helpers ──────────────────────────────────────────────────────────

async function getIP() {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

function makeToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex')
}

// Only ever redirect to a same-site relative path — never follow a `from`
// value like `//evil.com` or `https://evil.com` off-site (open redirect).
function safeRedirectPath(path) {
  if (typeof path !== 'string') return null
  if (!path.startsWith('/') || path.startsWith('//')) return null
  return path
}

// ── Actions ──────────────────────────────────────────────────────────

export async function register(state, formData) {
  const ip = await getIP()
  const { ok, retryAfter } = await rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!ok) {
    return { message: `Too many attempts. Try again in ${retryAfter}s.` }
  }

  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data
  const from = safeRedirectPath(formData.get('from')?.toString())

  const existing = await findUserByEmail(email)
  if (existing) {
    return { errors: { email: ['An account with this email already exists'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const verificationToken = makeToken()
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 h

  const user = await createUser({ name, email, passwordHash, verificationToken, verificationExpires })
  if (!user) {
    return { message: 'Failed to create account. Please try again.' }
  }

  // Only the very first person to ever register becomes the workspace admin.
  // Everyone after that starts with no workspace — an existing admin has to
  // invite them, and they join as a team member via /accept-invite.
  try {
    if ((await countWorkspaces()) === 0) {
      await createWorkspace({ ownerId: user.id, name: `${name}'s Workspace` })
    }
  } catch (err) {
    console.error('Workspace creation failed:', err)
  }

  try {
    await sendVerificationEmail(email, verificationToken)
  } catch (err) {
    console.error('Verification email failed:', err)
    // Don't block registration if email fails — user can resend
  }

  redirect(`/verify-email${from ? `?from=${encodeURIComponent(from)}` : ''}`)
}

export async function login(state, formData) {
  const ip = await getIP()
  const { ok, retryAfter } = await rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })
  if (!ok) {
    return { message: `Too many login attempts. Try again in ${retryAfter}s.` }
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const from = safeRedirectPath(formData.get('from')?.toString())

  // Same generic error whether the email doesn't exist or the password is
  // wrong — telling them apart lets an attacker enumerate registered emails.
  const genericError = { message: 'Invalid email or password.' }

  const user = await findUserByEmail(email)
  if (!user) {
    return genericError
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return genericError
  }

  if (!user.email_verified) {
    return {
      unverified: true,
      userId: user.id,
      message: 'Please verify your email before signing in.',
    }
  }

  await createSession(user.id, user.session_version)
  redirect(from ?? '/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

export async function resendVerification(state, formData) {
  const ip = await getIP()
  const { ok, retryAfter } = await rateLimit(`resend:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 })
  if (!ok) {
    return { message: `Too many attempts. Try again in ${retryAfter}s.` }
  }

  const email = formData.get('email')?.toString().toLowerCase().trim()
  if (!email) return { message: 'Email is required.' }

  const user = await findUserByEmail(email)
  // Always return the same message to avoid email enumeration
  if (!user || user.email_verified) {
    return { sent: true }
  }

  const token = makeToken()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await setVerificationToken(user.id, token, expires)

  try {
    await sendVerificationEmail(email, token)
  } catch (err) {
    console.error('Resend verification email failed:', err)
  }

  return { sent: true }
}

export async function forgotPassword(state, formData) {
  const ip = await getIP()
  const { ok, retryAfter } = await rateLimit(`forgot:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 })
  if (!ok) {
    return { message: `Too many attempts. Try again in ${retryAfter}s.` }
  }

  const email = formData.get('email')?.toString().toLowerCase().trim()
  if (!email) return { errors: { email: ['Email is required'] } }

  const user = await findUserByEmail(email)
  // Always respond the same way — never reveal whether the email exists
  if (user) {
    const token = makeToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 h
    await createPasswordResetToken(user.id, token, expiresAt)
    try {
      await sendPasswordResetEmail(email, token)
    } catch (err) {
      console.error('Password reset email failed:', err)
    }
  }

  return { sent: true }
}

export async function resetPassword(state, formData) {
  const ip = await getIP()
  const { ok, retryAfter } = await rateLimit(`reset:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!ok) {
    return { message: `Too many attempts. Try again in ${retryAfter}s.` }
  }

  const token = formData.get('token')?.toString()
  const password = formData.get('password')?.toString() ?? ''
  const confirm = formData.get('confirm')?.toString() ?? ''

  if (!token) return { message: 'Invalid or missing reset token.' }

  if (password.length < 8) {
    return { errors: { password: ['Password must be at least 8 characters'] } }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { errors: { password: ['Password must contain a letter'] } }
  }
  if (!/[0-9]/.test(password)) {
    return { errors: { password: ['Password must contain a number'] } }
  }
  if (password !== confirm) {
    return { errors: { confirm: ['Passwords do not match'] } }
  }

  const record = await verifyPasswordResetToken(token)
  if (!record) {
    return { message: 'This reset link is invalid or has expired.' }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await consumePasswordResetToken(record.token_id, record.user_id, passwordHash)
  // Invalidate any other active sessions (e.g. a stolen cookie) now that the
  // password has changed — this is exactly the scenario a reset is meant to fix.
  await bumpSessionVersion(record.user_id)

  redirect('/login?reset=1')
}

// Read-only check — does NOT consume the token. Used to render the confirm
// screen without verifying just because a link-scanner/prefetcher loaded the URL.
export async function checkVerificationToken(token) {
  if (!token) return { error: 'Missing token.' }
  const user = await findUserByVerificationToken(token)
  if (!user) return { error: 'This verification link is invalid or has expired.' }
  if (user.email_verified) return { alreadyVerified: true, email: user.email }
  return { valid: true, email: user.email }
}

// Mutating — only call this from an explicit user action (button click),
// never as a side effect of a GET page load.
export async function verifyEmail(token) {
  if (!token) return { error: 'Missing token.' }
  const user = await verifyEmailToken(token)
  if (!user) return { error: 'This verification link is invalid or has already been used.' }
  return { success: true, email: user.email }
}
