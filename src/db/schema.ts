import type { Message } from '@/types/chat'
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const threads = pgTable('threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: text('chat_id').notNull().unique(),
  userId: text('user_id').notNull(),
  diagram: text('diagram').default('').notNull(),
  conversation: jsonb('conversation').$type<Message[]>().default([]).notNull(),
  isCanvasShared: boolean('is_canvas_shared').default(false).notNull(),
  shareToken: text('share_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  shareTokenUnique: uniqueIndex('threads_share_token_unique').on(table.shareToken),
}))

export const authUser = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailUnique: uniqueIndex('user_email_unique').on(table.email),
}))

export const authSession = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tokenUnique: uniqueIndex('session_token_unique').on(table.token),
}))

export const authAccount = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  providerAccountUnique: uniqueIndex('account_provider_account_unique').on(
    table.providerId,
    table.accountId,
  ),
}))

export const authVerification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  identifierValueUnique: uniqueIndex('verification_identifier_value_unique').on(
    table.identifier,
    table.value,
  ),
}))

export type User = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
export type Thread = typeof threads.$inferSelect
export type InsertThread = typeof threads.$inferInsert
export type AuthUser = typeof authUser.$inferSelect
export type AuthSession = typeof authSession.$inferSelect
