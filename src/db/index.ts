import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable.')
}

// For query purposes
const globalForDb = globalThis as typeof globalThis & {
  __schemaAiPgClient?: ReturnType<typeof postgres>
}

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const queryClient =
  globalForDb.__schemaAiPgClient ||
  postgres(DATABASE_URL, {
    max: positiveInteger(process.env.DATABASE_MAX_CONNECTIONS, 5),
    idle_timeout: positiveInteger(
      process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
      20,
    ),
    connect_timeout: positiveInteger(
      process.env.DATABASE_CONNECT_TIMEOUT_SECONDS,
      10,
    ),
    max_lifetime: positiveInteger(
      process.env.DATABASE_MAX_LIFETIME_SECONDS,
      1_800,
    ),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__schemaAiPgClient = queryClient
}

export const db = drizzle(queryClient, { schema })
