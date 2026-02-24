'use server'

import { db } from '@/db'
import { type User, users } from '@/db/schema'
import type { User as AuthUser } from '@/lib/auth'
import { HARDCODED_USER } from '@/lib/auth-config'

export async function ensureUserExistsInDb(authUser: AuthUser): Promise<User> {
  const [dbUser] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email,
      password: HARDCODED_USER.password,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: authUser.email,
        updatedAt: new Date(),
      },
    })
    .returning()

  if (!dbUser) {
    throw new Error(`Failed to ensure user exists in DB: ${authUser.id}`)
  }

  return dbUser
}
