import 'server-only'

import type { Message } from '@/types/chat'
import { buildModelContext } from './context'
import { createOpenRouterProvider } from './providers/openrouter'
import type { AIProvider, SendMessageResult, ValidationResult } from './types'

let cachedProvider: AIProvider | null = null

function getProvider() {
  if (!cachedProvider) {
    cachedProvider = createOpenRouterProvider()
    console.log(`[AI] Using provider: ${cachedProvider.name}`)
  }

  return cachedProvider
}

export async function validateUserIntent(
  userMessage: string,
): Promise<ValidationResult> {
  return getProvider().validateUserIntent(userMessage)
}

export async function generateSchema(
  history: Message[],
  userMessage: string,
  currentDiagram: string,
): Promise<SendMessageResult> {
  return getProvider().generateSchema(
    buildModelContext(history),
    userMessage,
    currentDiagram,
  )
}
