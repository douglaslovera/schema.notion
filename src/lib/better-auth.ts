import { db } from '@/db'
import {
  authAccount,
  authSession,
  authUser,
  authVerification,
  oauthAccessToken,
  oauthApplication,
  oauthConsent,
} from '@/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from 'better-auth/api'
import { nextCookies, toNextJsHandler } from 'better-auth/next-js'
import { mcp } from 'better-auth/plugins'

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
      oauthApplication: oauthApplication,
      oauthAccessToken: oauthAccessToken,
      oauthConsent: oauthConsent,
    },
  }),
  emailAndPassword: {
    enabled: true,
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
  // Returns the full token row (refresh token included) without checking
  // expiry. /api/mcp verifies tokens itself.
  disabledPaths: ['/mcp/get-session'],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Authorization codes (and pending consent codes) live in the
      // verification table as JSON written by the MCP plugin.
      const findPendingAuthorization = async (code: string) => {
        const verification =
          await ctx.context.internalAdapter.findVerificationValue(code)

        if (!verification || verification.expiresAt < new Date()) {
          return null
        }

        try {
          return JSON.parse(verification.value) as {
            userId: string
            redirectURI: string
            requireConsent?: boolean
            state?: string | null
          }
        } catch {
          return null
        }
      }

      // Any client can register itself dynamically, so a signed-in user must
      // never be handed a code silently: always route through the consent page.
      if (ctx.path === '/mcp/authorize') {
        return { context: { query: { ...ctx.query, prompt: 'consent' } } }
      }

      // client_name is optional in dynamic registration but required by our
      // oauth_application table.
      if (ctx.path === '/mcp/register' && ctx.body && !ctx.body.client_name) {
        return {
          context: { body: { ...ctx.body, client_name: 'MCP client' } },
        }
      }

      // The plugin's token endpoint doesn't check requireConsent, so a code
      // still waiting on the consent page could be exchanged directly. It also
      // stringifies whatever `code` it gets, so only plain strings get through.
      if (ctx.path === '/mcp/token') {
        const body =
          ctx.body instanceof FormData
            ? Object.fromEntries(ctx.body.entries())
            : (ctx.body ?? {})

        if (body.code !== undefined && typeof body.code !== 'string') {
          throw new APIError('BAD_REQUEST', {
            error: 'invalid_request',
            error_description: 'code must be a string',
          })
        }

        if (typeof body.code === 'string') {
          const pending = await findPendingAuthorization(body.code)

          if (pending?.requireConsent) {
            throw new APIError('UNAUTHORIZED', {
              error: 'invalid_grant',
              error_description: 'Authorization is still waiting for consent',
            })
          }
        }
      }

      // The plugin's consent endpoint never checks that the signed-in user is
      // the one who started the authorization, and its denial redirect drops
      // `state`. Validate here and answer denials ourselves.
      if (ctx.path === '/oauth2/consent') {
        const session = await getSessionFromCtx(ctx)
        const bodyCode = ctx.body?.consent_code
        const consentCode =
          typeof bodyCode === 'string' && bodyCode
            ? bodyCode
            : await ctx.getSignedCookie(
                'oidc_consent_prompt',
                ctx.context.secret,
              )
        const pending = consentCode
          ? await findPendingAuthorization(consentCode)
          : null

        if (
          !session ||
          !consentCode ||
          !pending?.requireConsent ||
          pending.userId !== session.user.id
        ) {
          throw new APIError('UNAUTHORIZED', {
            error: 'invalid_request',
            error_description: 'Invalid or expired consent request',
          })
        }

        if (ctx.body?.accept !== true) {
          await ctx.context.internalAdapter.deleteVerificationByIdentifier(
            consentCode,
          )
          const redirectURI = new URL(pending.redirectURI)
          redirectURI.searchParams.set('error', 'access_denied')
          redirectURI.searchParams.set(
            'error_description',
            'User denied access',
          )
          if (pending.state)
            redirectURI.searchParams.set('state', pending.state)

          return ctx.json({ redirectURI: redirectURI.toString() })
        }

        return {
          context: { body: { ...ctx.body, consent_code: consentCode } },
        }
      }
    }),
  },
  plugins: [
    mcp({
      loginPage: '/sign-in',
      resource: `${betterAuthUrl.replace(/\/+$/, '')}/api/mcp`,
      oidcConfig: {
        loginPage: '/sign-in',
        consentPage: '/oauth/consent',
        requirePKCE: true,
      },
    }),
    nextCookies(),
  ],
})

export const authHandlers = toNextJsHandler(auth)
