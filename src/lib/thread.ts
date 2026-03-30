'use server'

import { db } from '@/db'
import { type Thread, threads } from '@/db/schema'
import type { Message } from '@/types/chat'
import { and, eq } from 'drizzle-orm'
import { getCurrentUser } from './auth'

export interface ThreadData {
  chatId: string
  userId: string
  diagram?: string
  conversation?: Message[]
  isCanvasShared?: boolean
  shareToken?: string | null
}

export interface SharedCanvasThread {
  chatId: string
  diagram: string
}

type ThreadDbError = {
  code?: string
  constraint_name?: string
  detail?: string
  table_name?: string
}

function logThreadDbError(
  operation: 'createThread' | 'updateThread',
  context: { chatId: string; userId?: string },
  error: unknown,
) {
  const dbError = error as ThreadDbError

  console.error(`[thread:${operation}] Database error`, {
    ...context,
    code: dbError?.code,
    constraintName: dbError?.constraint_name,
    detail: dbError?.detail,
    tableName: dbError?.table_name,
    error,
  })
}

export async function createThread(
  userId: string,
  data: Partial<ThreadData>,
): Promise<Thread> {
  const resolvedChatId = data.chatId || crypto.randomUUID()

  try {
    const [newThread] = await db
      .insert(threads)
      .values({
        chatId: resolvedChatId,
        userId,
        diagram: data.diagram || '',
        conversation: data.conversation || [],
      })
      .returning()

    return newThread
  } catch (error) {
    logThreadDbError('createThread', { chatId: resolvedChatId, userId }, error)
    throw error
  }
}

export async function getThread(chatId: string): Promise<Thread | null> {
  const [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.chatId, chatId))
    .limit(1)

  return thread || null
}

export async function updateThread(
  chatId: string,
  data: Partial<ThreadData>,
  userId?: string,
): Promise<Thread | null> {
  const updateData: Partial<Thread> = {}

  if (data.diagram !== undefined) updateData.diagram = data.diagram
  if (data.conversation !== undefined)
    updateData.conversation = data.conversation
  if (data.isCanvasShared !== undefined)
    updateData.isCanvasShared = data.isCanvasShared
  if (data.shareToken !== undefined) updateData.shareToken = data.shareToken

  if (Object.keys(updateData).length === 0) {
    return await getThread(chatId)
  }

  updateData.updatedAt = new Date()

  try {
    const [updatedThread] = await db
      .update(threads)
      .set(updateData)
      .where(
        userId
          ? and(eq(threads.chatId, chatId), eq(threads.userId, userId))
          : eq(threads.chatId, chatId),
      )
      .returning()

    return updatedThread || null
  } catch (error) {
    logThreadDbError('updateThread', { chatId, userId }, error)
    throw error
  }
}

export async function getThreadsByUserId(userId: string): Promise<Thread[]> {
  const userThreads = await db
    .select()
    .from(threads)
    .where(eq(threads.userId, userId))
    .orderBy(threads.createdAt)

  return userThreads
}

export async function deleteThread(chatId: string): Promise<boolean> {
  const [deletedThread] = await db
    .delete(threads)
    .where(eq(threads.chatId, chatId))
    .returning()

  return !!deletedThread
}

export async function enableCanvasSharing(chatId: string): Promise<string> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const thread = await getThread(chatId)

  if (!thread || thread.userId !== user.id) {
    throw new Error('Thread not found')
  }

  if (thread.isCanvasShared && thread.shareToken) {
    return thread.shareToken
  }

  const shareToken = thread.shareToken || crypto.randomUUID().replaceAll('-', '')

  const updatedThread = await updateThread(
    chatId,
    {
      isCanvasShared: true,
      shareToken,
    },
    user.id,
  )

  if (!updatedThread?.shareToken) {
    throw new Error('Failed to enable canvas sharing')
  }

  return updatedThread.shareToken
}

export async function getSharedThreadByToken(
  shareToken: string,
): Promise<SharedCanvasThread | null> {
  const [thread] = await db
    .select({
      chatId: threads.chatId,
      diagram: threads.diagram,
    })
    .from(threads)
    .where(
      and(
        eq(threads.shareToken, shareToken),
        eq(threads.isCanvasShared, true),
      ),
    )
    .limit(1)

  return thread || null
}

export async function duplicateThread(
  chatId: string,
  userId: string,
): Promise<Thread | null> {
  const thread = await getThread(chatId)

  if (!thread) {
    return null
  }

  const newChatId = crypto.randomUUID()

  const newThread = await createThread(userId, {
    chatId: newChatId,
    diagram: thread.diagram,
    conversation: thread.conversation as Message[],
  })

  return newThread
}

/**
 * Save or update a thread for the current authenticated user.
 * Automatically resolves the user from the session.
 * If the thread doesn't exist, creates it. Otherwise updates it.
 */
export async function saveThreadForCurrentUser(
  data: Partial<ThreadData> & { chatId: string },
): Promise<Thread> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const existingThread = await getThread(data.chatId)

  if (existingThread && existingThread.userId !== user.id) {
    throw new Error('Thread does not belong to the current user')
  }

  if (existingThread) {
    // Update existing thread
    const updated = await updateThread(data.chatId, data, user.id)
    if (!updated) {
      throw new Error('Failed to update thread')
    }
    return updated
  }

  // Create new thread
  return createThread(user.id, data)
}
