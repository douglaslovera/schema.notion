import 'server-only'

import { db } from '@/db'
import { messages, threads } from '@/db/schema'
import type { Message } from '@/types/chat'
import type {
  SharedCanvasThread,
  SidebarThread,
  ThreadWithConversation,
} from '@/types/thread'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import { buildThreadTitle } from './thread-validation'

export class ThreadOwnershipError extends Error {
  constructor() {
    super('Thread not found')
    this.name = 'ThreadOwnershipError'
  }
}

export interface UserTurn {
  currentDiagram: string
  history: Message[]
}

function toMessage(record: typeof messages.$inferSelect): Message {
  return {
    id: record.clientId,
    timestamp: record.sentAt.getTime(),
    role: record.role,
    diagram: record.diagram,
    message: record.message,
  }
}

const conversationOrder = [
  asc(messages.sentAt),
  asc(messages.createdAt),
  asc(messages.id),
]

export async function getThreadForUser(
  chatId: string,
  userId: string,
): Promise<ThreadWithConversation | null> {
  const [thread] = await db
    .select()
    .from(threads)
    .where(and(eq(threads.chatId, chatId), eq(threads.userId, userId)))
    .limit(1)

  if (!thread) {
    return null
  }

  const conversation = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(...conversationOrder)

  return {
    ...thread,
    conversation: conversation.map(toMessage),
  }
}

export async function getThreadSummariesForUser(
  userId: string,
): Promise<SidebarThread[]> {
  return db
    .select({
      chatId: threads.chatId,
      title: threads.title,
      updatedAt: threads.updatedAt,
      isCanvasShared: threads.isCanvasShared,
      shareToken: threads.shareToken,
    })
    .from(threads)
    .where(eq(threads.userId, userId))
    .orderBy(desc(threads.updatedAt))
}

/**
 * Persist the user's message and return the context needed to answer it.
 *
 * The message is written before the model is ever called, so a failed or
 * rejected turn still leaves the user's input in the thread. Re-sending the
 * same clientMessageId is a no-op, which makes client retries safe.
 */
export async function appendUserMessage(
  userId: string,
  chatId: string,
  clientMessageId: string,
  message: string,
): Promise<UserTurn> {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .insert(threads)
      .values({
        chatId,
        userId,
        title: buildThreadTitle(message),
      })
      .onConflictDoUpdate({
        target: threads.chatId,
        set: { updatedAt: new Date() },
        setWhere: eq(threads.userId, userId),
      })
      .returning()

    // A thread owned by someone else matches the conflict target but fails
    // setWhere, so nothing comes back.
    if (!thread) {
      throw new ThreadOwnershipError()
    }

    await tx
      .insert(messages)
      .values({
        chatId,
        clientId: clientMessageId,
        role: 'user',
        message,
        diagram: '',
        sentAt: new Date(),
      })
      .onConflictDoNothing({
        target: [messages.chatId, messages.clientId],
      })

    const conversation = await tx
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(...conversationOrder)

    return {
      currentDiagram: thread.diagram,
      // The turn being answered is excluded: callers pass it to the model
      // separately, and dropping it here also keeps retries idempotent.
      history: conversation
        .filter((record) => record.clientId !== clientMessageId)
        .map(toMessage),
    }
  })
}

/**
 * Persist the assistant's reply. When `diagram` is provided it becomes the
 * thread's current diagram; rejections and errors pass no diagram and leave it
 * untouched.
 */
export async function appendAssistantMessage(
  userId: string,
  chatId: string,
  reply: { message: string; diagram?: string },
): Promise<Message> {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .update(threads)
      .set(
        reply.diagram === undefined
          ? { updatedAt: new Date() }
          : { diagram: reply.diagram, updatedAt: new Date() },
      )
      .where(and(eq(threads.chatId, chatId), eq(threads.userId, userId)))
      .returning({ chatId: threads.chatId })

    if (!thread) {
      throw new ThreadOwnershipError()
    }

    const [record] = await tx
      .insert(messages)
      .values({
        chatId,
        clientId: crypto.randomUUID(),
        role: 'model',
        message: reply.message,
        diagram: reply.diagram ?? '',
        sentAt: new Date(),
      })
      .returning()

    return toMessage(record)
  })
}

/**
 * Create a thread, optionally seeded with a diagram. The seed is recorded as an
 * assistant message in the same transaction so a failure leaves nothing behind.
 */
export async function createThreadForUser(
  userId: string,
  chatId: string,
  input: { title: string; diagram?: string; message?: string },
): Promise<SidebarThread> {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .insert(threads)
      .values({
        chatId,
        userId,
        title: buildThreadTitle(input.title),
        diagram: input.diagram ?? '',
      })
      .returning({
        chatId: threads.chatId,
        title: threads.title,
        updatedAt: threads.updatedAt,
        isCanvasShared: threads.isCanvasShared,
        shareToken: threads.shareToken,
      })

    if (input.diagram) {
      await tx.insert(messages).values({
        chatId,
        clientId: crypto.randomUUID(),
        role: 'model',
        message: input.message ?? '',
        diagram: input.diagram,
        sentAt: new Date(),
      })
    }

    return thread
  })
}

export async function renameThreadForUser(
  chatId: string,
  userId: string,
  title: string,
): Promise<SidebarThread> {
  const [thread] = await db
    .update(threads)
    .set({ title: buildThreadTitle(title) })
    .where(and(eq(threads.chatId, chatId), eq(threads.userId, userId)))
    .returning({
      chatId: threads.chatId,
      title: threads.title,
      updatedAt: threads.updatedAt,
      isCanvasShared: threads.isCanvasShared,
      shareToken: threads.shareToken,
    })

  if (!thread) {
    throw new ThreadOwnershipError()
  }

  return thread
}

export async function deleteThreadForUser(
  chatId: string,
  userId: string,
): Promise<boolean> {
  const [deletedThread] = await db
    .delete(threads)
    .where(and(eq(threads.chatId, chatId), eq(threads.userId, userId)))
    .returning({ chatId: threads.chatId })

  return !!deletedThread
}

export async function enableCanvasSharingForUser(
  chatId: string,
  userId: string,
): Promise<string> {
  const candidateToken = crypto.randomUUID().replaceAll('-', '')
  const [thread] = await db
    .update(threads)
    .set({
      isCanvasShared: true,
      shareToken: sql`coalesce(${threads.shareToken}, ${candidateToken})`,
    })
    .where(and(eq(threads.chatId, chatId), eq(threads.userId, userId)))
    .returning({ shareToken: threads.shareToken })

  if (!thread?.shareToken) {
    throw new ThreadOwnershipError()
  }

  return thread.shareToken
}

export async function disableCanvasSharingForUser(
  chatId: string,
  userId: string,
): Promise<boolean> {
  const [thread] = await db
    .update(threads)
    .set({ isCanvasShared: false })
    .where(and(eq(threads.chatId, chatId), eq(threads.userId, userId)))
    .returning({ chatId: threads.chatId })

  if (!thread) {
    throw new ThreadOwnershipError()
  }

  return true
}

export async function duplicateThreadForUser(
  sourceChatId: string,
  userId: string,
  newChatId: string,
): Promise<ThreadWithConversation | null> {
  return db.transaction(async (tx) => {
    const [source] = await tx
      .select()
      .from(threads)
      .where(and(eq(threads.chatId, sourceChatId), eq(threads.userId, userId)))
      .limit(1)

    if (!source) {
      return null
    }

    const sourceMessages = await tx
      .select()
      .from(messages)
      .where(eq(messages.chatId, sourceChatId))
      .orderBy(...conversationOrder)

    const [duplicate] = await tx
      .insert(threads)
      .values({
        chatId: newChatId,
        userId,
        title: source.title,
        diagram: source.diagram,
      })
      .returning()

    if (sourceMessages.length > 0) {
      await tx.insert(messages).values(
        sourceMessages.map((message) => ({
          chatId: newChatId,
          clientId: message.clientId,
          role: message.role,
          message: message.message,
          diagram: message.diagram,
          sentAt: message.sentAt,
        })),
      )
    }

    return {
      ...duplicate,
      conversation: sourceMessages.map(toMessage),
    }
  })
}

export async function getSharedThreadByToken(
  shareToken: string,
): Promise<SharedCanvasThread | null> {
  const [thread] = await db
    .select({
      diagram: threads.diagram,
    })
    .from(threads)
    .where(
      and(eq(threads.shareToken, shareToken), eq(threads.isCanvasShared, true)),
    )
    .limit(1)

  return thread || null
}
