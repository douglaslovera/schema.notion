'use server'

import type { Message } from '@/types/chat'
import { createOpenRouterProvider } from './providers/openrouter'
import type {
  AIProvider,
  ChatMessage,
  SendMessageResult,
  ValidationResult,
} from './types'

/**
 * Singleton cache so we don't re-create the provider on every call.
 */
let cachedProvider: AIProvider | null = null

function getProvider() {
  if (cachedProvider) return cachedProvider

  cachedProvider = createOpenRouterProvider()

  console.log(`[AI] Using provider: ${cachedProvider.name}`)
  return cachedProvider
}

// ─── Public server actions ────────────────────────────────────────
// These are the functions the rest of the app should import.
// They delegate to the OpenRouter provider.

export async function validateUserIntent(
  userMessage: string,
): Promise<ValidationResult> {
  return getProvider().validateUserIntent(userMessage)
}

export async function sendUserMessage(
  history: ChatMessage[],
  userMessage: string,
): Promise<SendMessageResult> {
  return getProvider().sendUserMessage(history, userMessage)
}

export async function normalizeChat(
  messages: Message[],
): Promise<ChatMessage[]> {
  return getProvider().normalizeChat(messages)
}
