import { db } from '@/db'
import { oauthAccessToken } from '@/db/schema'
import { getAllowlistedUserById } from '@/lib/access-allowlist'
import { createSchemaNotionMcpServer } from '@/lib/mcp/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// Bearer tokens only, no cookies, so any origin may call (e.g. MCP Inspector
// running in a browser).
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
}

function withCors(response: Response) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

function jsonRpcError(
  status: number,
  code: number,
  message: string,
  headers?: HeadersInit,
) {
  return withCors(
    Response.json(
      { jsonrpc: '2.0', error: { code, message }, id: null },
      { status, headers },
    ),
  )
}

function unauthorized(message: string) {
  const resourceMetadata = `${(process.env.BETTER_AUTH_URL || '').replace(/\/+$/, '')}/.well-known/oauth-protected-resource`

  return jsonRpcError(401, -32000, `Unauthorized: ${message}`, {
    'WWW-Authenticate': `Bearer error="invalid_token", resource_metadata="${resourceMetadata}"`,
  })
}

/**
 * Resolve the bearer token ourselves: Better Auth's getMcpSession neither
 * checks expiry nor keeps the refresh token private, so it's disabled.
 */
async function getTokenUserId(request: Request) {
  const header = request.headers.get('authorization') ?? ''
  const match = /^Bearer\s+(\S+)$/i.exec(header)

  if (!match) return null

  const [token] = await db
    .select({
      userId: oauthAccessToken.userId,
      expiresAt: oauthAccessToken.accessTokenExpiresAt,
    })
    .from(oauthAccessToken)
    .where(eq(oauthAccessToken.accessToken, match[1]))
    .limit(1)

  if (!token?.userId || token.expiresAt.getTime() <= Date.now()) {
    return null
  }

  return token.userId
}

/**
 * Remote MCP endpoint (Streamable HTTP, stateless). Each request gets its own
 * server bound to the token's user, so no state is shared between callers.
 */
export async function POST(request: Request) {
  const userId = await getTokenUserId(request)

  if (!userId) {
    return unauthorized('missing, invalid or expired token')
  }

  const user = await getAllowlistedUserById(userId)

  if (!user) {
    return jsonRpcError(
      403,
      -32001,
      'Your account does not have access to schema.notion yet.',
    )
  }

  const server = createSchemaNotionMcpServer(user)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  await server.connect(transport)
  return withCors(await transport.handleRequest(request))
}

// Stateless server: no standalone SSE stream and no sessions to close.
function methodNotAllowed() {
  return jsonRpcError(405, -32000, 'Method not allowed', { Allow: 'POST' })
}

export { methodNotAllowed as DELETE, methodNotAllowed as GET }

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
