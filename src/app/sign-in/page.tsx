import { PATHS } from '@/constants/paths'
import { isUserAllowlisted } from '@/lib/access-allowlist'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SignInScreen } from './sign-in-screen'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/**
 * The MCP OAuth flow sends unauthenticated users here with the original
 * authorize query. After signing in they resume that request instead of
 * landing in the app.
 */
function getRedirectPath(params: Record<string, string | string[] | undefined>) {
  if (typeof params.client_id !== 'string' || !params.response_type) {
    return PATHS.NEW_CHAT
  }

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item)
    }
  }

  return `/api/auth/mcp/authorize?${query.toString()}`
}

export default async function SignInPage({ searchParams }: PageProps) {
  const redirectPath = getRedirectPath(await searchParams)
  const user = await getCurrentUser()

  if (user) {
    const isAllowlisted = await isUserAllowlisted(user)

    if (!isAllowlisted) {
      redirect('/#waitlist')
    }

    redirect(redirectPath)
  }

  return <SignInScreen redirectPath={redirectPath} />
}
