import { auth } from '@/lib/better-auth'
import { oAuthDiscoveryMetadata } from 'better-auth/plugins'

// Also answers path-suffixed lookups (e.g. /.well-known/oauth-authorization-server/api/auth).
export const GET = oAuthDiscoveryMetadata(auth)
