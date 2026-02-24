import { db } from '@/db'
import {
  authAccount,
  authSession,
  authUser,
  authVerification,
} from '@/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies, toNextJsHandler } from 'better-auth/next-js'

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || ''
const betterAuthUrl =
  process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ''
const hasNotionOAuth =
  !!process.env.NOTION_CLIENT_ID && !!process.env.NOTION_CLIENT_SECRET

if (!betterAuthSecret) {
  throw new Error(
    'Missing BETTER_AUTH_SECRET environment variable for Better Auth.',
  )
}

if (!betterAuthUrl) {
  throw new Error(
    'Missing BETTER_AUTH_URL environment variable for Better Auth.',
  )
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    'Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET for Google OAuth.',
  )
}

const googleClientId = process.env.GOOGLE_CLIENT_ID as string
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET as string
const notionClientId = process.env.NOTION_CLIENT_ID
const notionClientSecret = process.env.NOTION_CLIENT_SECRET

export const auth = betterAuth({
  secret: betterAuthSecret,
  baseURL: betterAuthUrl,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
    ...(hasNotionOAuth
      ? {
          // Keep Notion configured for future product features (e.g. exporting to Notion).
          notion: {
            clientId: notionClientId as string,
            clientSecret: notionClientSecret as string,
          },
        }
      : {}),
  },
  plugins: [nextCookies()],
})

export const authHandlers = toNextJsHandler(auth)
