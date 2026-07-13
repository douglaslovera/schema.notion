'use server'

import { generateSchema, validateUserIntent } from '@/lib/ai'
import type { Message } from '@/types/chat'
import { ZodError } from 'zod'
import { requireAllowlistedCurrentUser } from './access-allowlist'
import {
  type SendChatMessageInput,
  sendChatMessageSchema,
} from './chat-validation'
import {
  ThreadOwnershipError,
  appendAssistantMessage,
  appendUserMessage,
} from './thread'

export interface SendChatMessageResult {
  assistantMessage: Message
  diagram: string
}

const SUMMARY = {
  created:
    'He generado la primera propuesta de bases de datos de Notion según tu solicitud.',
  updated:
    'Actualicé la estructura de bases de datos de Notion con los cambios que pediste.',
  unchanged: 'No se detectaron cambios estructurales en la propuesta de Notion.',
}

function summarize(previousDiagram: string, nextDiagram: string) {
  if (!nextDiagram) {
    return SUMMARY.unchanged
  }

  if (!previousDiagram) {
    return SUMMARY.created
  }

  return previousDiagram === nextDiagram ? SUMMARY.unchanged : SUMMARY.updated
}

function toSafeActionError(error: unknown, fallbackMessage: string): never {
  if (error instanceof ZodError) {
    throw new Error('Invalid request')
  }

  if (error instanceof ThreadOwnershipError) {
    throw new Error('Thread not found')
  }

  console.error('[chat:send] Failed', { name: (error as Error)?.name })
  throw new Error(fallbackMessage)
}

/**
 * Run one chat turn end to end: persist the user's message, ask the model, then
 * persist the reply.
 *
 * The user's message is committed before the model is called, so a rejected or
 * failed turn never loses it. History and the current diagram are read from the
 * database rather than supplied by the caller.
 */
export async function sendChatMessage(
  input: SendChatMessageInput,
): Promise<SendChatMessageResult> {
  const user = await requireAllowlistedCurrentUser()

  try {
    const data = sendChatMessageSchema.parse(input)

    const { currentDiagram, history } = await appendUserMessage(
      user.id,
      data.chatId,
      data.clientMessageId,
      data.message,
    )

    const validation = await validateUserIntent(data.message)

    if (!validation.isValid) {
      const assistantMessage = await appendAssistantMessage(
        user.id,
        data.chatId,
        { message: validation.message },
      )

      return { assistantMessage, diagram: currentDiagram }
    }

    const { responseText } = await generateSchema(
      history,
      data.message,
      currentDiagram,
    )

    const assistantMessage = await appendAssistantMessage(
      user.id,
      data.chatId,
      {
        message: summarize(currentDiagram, responseText),
        diagram: responseText,
      },
    )

    return { assistantMessage, diagram: responseText }
  } catch (error) {
    return toSafeActionError(error, 'Unable to process the message')
  }
}
