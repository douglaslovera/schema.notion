'use server'

import { db } from '@/db'
import { accessAllowlist } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getCurrentUser, type User } from './auth'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function isUserAllowlisted(user: User): Promise<boolean> {
  const [entry] = await db
    .select({ id: accessAllowlist.id })
    .from(accessAllowlist)
    .where(eq(sql`lower(${accessAllowlist.email})`, normalizeEmail(user.email)))
    .limit(1)

  return !!entry
}

export async function getAllowlistedCurrentUser(): Promise<User | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const isAllowlisted = await isUserAllowlisted(user)

  return isAllowlisted ? user : null
}

export async function requireAllowlistedCurrentUser(): Promise<User> {
  const user = await getAllowlistedCurrentUser()

  if (!user) {
    throw new Error('User is not allowlisted')
  }

  return user
}
