import type { Roles } from '@/types/chat'
import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const lower = (column: AnyPgColumn) => sql`lower(${column})`

const auditTimestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const authUser = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    ...auditTimestamps(),
  },
  (table) => ({
    emailUnique: uniqueIndex('user_email_unique').on(table.email),
  }),
)

export const threads = pgTable(
  'threads',
  {
    chatId: text('chat_id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    title: text('title').default('Nuevo workspace').notNull(),
    diagram: text('diagram').default('').notNull(),
    isCanvasShared: boolean('is_canvas_shared').default(false).notNull(),
    shareToken: text('share_token'),
    ...auditTimestamps(),
  },
  (table) => ({
    shareTokenUnique: uniqueIndex('threads_share_token_unique').on(
      table.shareToken,
    ),
    userUpdatedAtIndex: index('threads_user_updated_at_idx').on(
      table.userId,
      table.updatedAt.desc(),
    ),
  }),
)

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: text('chat_id')
      .notNull()
      .references(() => threads.chatId, { onDelete: 'cascade' }),
    clientId: text('client_id').notNull(),
    role: text('role').$type<Roles>().notNull(),
    message: text('message').notNull(),
    diagram: text('diagram').default('').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    chatClientUnique: uniqueIndex('messages_chat_client_unique').on(
      table.chatId,
      table.clientId,
    ),
    chatSentAtIndex: index('messages_chat_sent_at_idx').on(
      table.chatId,
      table.sentAt,
      table.createdAt,
    ),
    roleCheck: check(
      'messages_role_check',
      sql`${table.role} in ('user', 'model')`,
    ),
  }),
)

export const authSession = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...auditTimestamps(),
  },
  (table) => ({
    tokenUnique: uniqueIndex('session_token_unique').on(table.token),
    userIdIndex: index('session_user_id_idx').on(table.userId),
  }),
)

export const authAccount = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    ...auditTimestamps(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex('account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
    userIdIndex: index('account_user_id_idx').on(table.userId),
  }),
)

export const authVerification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...auditTimestamps(),
  },
  (table) => ({
    identifierValueUnique: uniqueIndex(
      'verification_identifier_value_unique',
    ).on(table.identifier, table.value),
  }),
)

export const accessAllowlist = pgTable(
  'access_allowlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    ...auditTimestamps(),
  },
  (table) => ({
    emailLowerUnique: uniqueIndex('access_allowlist_email_lower_unique').on(
      lower(table.email),
    ),
  }),
)

export type Thread = typeof threads.$inferSelect
export type InsertThread = typeof threads.$inferInsert
export type MessageRecord = typeof messages.$inferSelect
export type AuthUser = typeof authUser.$inferSelect
export type AuthSession = typeof authSession.$inferSelect
export type AccessAllowlistEntry = typeof accessAllowlist.$inferSelect
