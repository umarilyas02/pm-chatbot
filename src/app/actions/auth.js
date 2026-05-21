'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createUser, findUserByEmail } from '@/lib/db'
import { createSession, deleteSession } from '@/lib/session'

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

// ── Actions ──────────────────────────────────────────────────────────

export async function register(state, formData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, password } = parsed.data

  const existing = await findUserByEmail(email)
  if (existing) {
    return { errors: { email: ['An account with this email already exists'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser({ name, email, passwordHash })

  if (!user) {
    return { message: 'Failed to create account. Please try again.' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function login(state, formData) {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data

  const user = await findUserByEmail(email)
  if (!user) {
    return { errors: { email: ['No account found with this email'] } }
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return { errors: { password: ['Incorrect password'] } }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
