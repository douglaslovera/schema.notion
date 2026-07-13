'use server'

import { requireAllowlistedCurrentUser } from '@/lib/access-allowlist'
import { ZodError } from 'zod'
import {
  ThreadOwnershipError,
  deleteThreadForUser,
  duplicateThreadForUser,
  enableCanvasSharingForUser,
} from './thread'
import { chatIdSchema } from './thread-validation'

type ThreadDbError = {
  code?: string
  constraint_name?: string
  table_name?: string
}

function logThreadActionError(operation: string, error: unknown) {
  const dbError = error as ThreadDbError

  console.error(`[thread:${operation}] Failed`, {
    code: dbError?.code,
    constraintName: dbError?.constraint_name,
    tableName: dbError?.table_name,
  })
}

function toSafeActionError(error: unknown, fallbackMessage: string): never {
  if (error instanceof ZodError) {
    throw new Error('Invalid request')
  }

  if (error instanceof ThreadOwnershipError) {
    throw new Error('Thread not found')
  }

  throw new Error(fallbackMessage)
}

export async function deleteThread(chatId: string): Promise<boolean> {
  const user = await requireAllowlistedCurrentUser()

  try {
    return await deleteThreadForUser(chatIdSchema.parse(chatId), user.id)
  } catch (error) {
    logThreadActionError('delete', error)
    return toSafeActionError(error, 'Unable to delete thread')
  }
}

export async function enableCanvasSharing(chatId: string): Promise<string> {
  const user = await requireAllowlistedCurrentUser()

  try {
    return await enableCanvasSharingForUser(chatIdSchema.parse(chatId), user.id)
  } catch (error) {
    logThreadActionError('share', error)
    return toSafeActionError(error, 'Unable to share thread')
  }
}

export async function duplicateThread(
  sourceChatId: string,
): Promise<{ chatId: string } | null> {
  const user = await requireAllowlistedCurrentUser()

  try {
    const duplicate = await duplicateThreadForUser(
      chatIdSchema.parse(sourceChatId),
      user.id,
      crypto.randomUUID(),
    )
    return duplicate ? { chatId: duplicate.chatId } : null
  } catch (error) {
    logThreadActionError('duplicate', error)
    return toSafeActionError(error, 'Unable to duplicate thread')
  }
}
