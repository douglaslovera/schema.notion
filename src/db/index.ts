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

const queryClient = globalForDb.__schemaAiPgClient || postgres(DATABASE_URL)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__schemaAiPgClient = queryClient
}

export const db = drizzle(queryClient, { schema })
