import { db } from '@/db'
import { authVerification, oauthApplication } from '@/db/schema'
import { isUserAllowlisted } from '@/lib/access-allowlist'
import { getCurrentUser } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { ConsentScreen } from './consent-screen'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

interface PendingAuthorization {
  clientId: string
  redirectURI: string
  userId: string
  requireConsent?: boolean
}

/**
 * Look up what is actually being authorized from the consent code, rather than
 * trusting client_id from the URL: the code pins the client, user and the
 * exact redirect URI the browser will be sent to.
 */
async function getPendingAuthorization(consentCode: string, userId: string) {
  const [verification] = await db
    .select({
      value: authVerification.value,
      expiresAt: authVerification.expiresAt,
    })
    .from(authVerification)
    .where(eq(authVerification.identifier, consentCode))
    .limit(1)

  if (!verification || verification.expiresAt.getTime() <= Date.now()) {
    return null
  }

  let pending: PendingAuthorization
  try {
    pending = JSON.parse(verification.value) as PendingAuthorization
  } catch {
    return null
  }

  if (!pending.requireConsent || pending.userId !== userId) {
    return null
  }

  const [client] = await db
    .select({ name: oauthApplication.name })
    .from(oauthApplication)
    .where(eq(oauthApplication.clientId, pending.clientId))
    .limit(1)

  if (!client) {
    return null
  }

  let redirectHost = pending.redirectURI
  try {
    redirectHost = new URL(pending.redirectURI).host || pending.redirectURI
  } catch {}

  return { clientName: client.name, redirectHost }
}

export default async function OAuthConsentPage({ searchParams }: PageProps) {
  const params = await searchParams
  const consentCode =
    typeof params.consent_code === 'string' ? params.consent_code : null

  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (!(await isUserAllowlisted(user))) {
    redirect('/#waitlist')
  }

  const pending = consentCode
    ? await getPendingAuthorization(consentCode, user.id)
    : null

  return (
    <ConsentScreen
      consentCode={pending ? consentCode : null}
      clientName={pending?.clientName ?? null}
      redirectHost={pending?.redirectHost ?? null}
      email={user.email}
    />
  )
}
