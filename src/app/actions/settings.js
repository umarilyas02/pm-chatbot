'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { updateUser, getUserWithHash } from '@/lib/db'

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
})

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-zA-Z]/, 'Must contain a letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function updateProfile(state, formData) {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const parsed = ProfileSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await updateUser(session.userId, { name: parsed.data.name })
  return { success: 'Profile updated' }
}

export async function changePassword(state, formData) {
  const session = await getSession()
  if (!session?.userId) redirect('/login')

  const parsed = PasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword:     formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getUserWithHash(session.userId)
  if (!user) redirect('/login')

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password_hash)
  if (!valid) {
    return { errors: { currentPassword: ['Current password is incorrect'] } }
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 12)
  await updateUser(session.userId, { password_hash: hash })
  return { success: 'Password changed successfully' }
}
