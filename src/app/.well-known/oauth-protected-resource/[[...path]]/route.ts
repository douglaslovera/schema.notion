import { auth } from '@/lib/better-auth'
import { oAuthProtectedResourceMetadata } from 'better-auth/plugins'

// Also answers path-suffixed lookups (e.g. /.well-known/oauth-protected-resource/api/mcp).
export const GET = oAuthProtectedResourceMetadata(auth)
