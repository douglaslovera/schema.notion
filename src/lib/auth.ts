import 'server-only'

import type { User } from '@/types/auth'
import { headers } from 'next/headers'
import { auth } from './better-auth'

export type { User } from '@/types/auth'

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email:
      session.user.email || `${session.user.name || 'notion-user'}@unknown`,
  }
}
