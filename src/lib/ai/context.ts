import type { Message } from '@/types/chat'
import type { ChatMessage } from './types'

/**
 * How many past messages are replayed to the model. Older turns are dropped:
 * the current diagram already encodes their outcome.
 */
export const MAX_CONTEXT_MESSAGES = 40

/**
 * Build the model context from stored messages.
 *
 * Only the text of each turn is replayed. Diagram snapshots stored on assistant
 * messages are deliberately excluded — the caller passes the current diagram
 * separately, exactly once.
 */
export function buildModelContext(history: Message[]): ChatMessage[] {
  return history
    .slice(-MAX_CONTEXT_MESSAGES)
    .filter((message) => message.message.trim().length > 0)
    .map((message) => ({
      role: message.role,
      parts: [{ text: message.message }],
    }))
}
