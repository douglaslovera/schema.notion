'use server'

import { headers } from 'next/headers'
import { auth } from './better-auth'

export interface User {
  id: string
  email: string
}

export async function logout(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email || `${session.user.name || 'notion-user'}@unknown`,
  }
}
