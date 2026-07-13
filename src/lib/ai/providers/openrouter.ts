import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
import { AI_MODELS } from '@/lib/ai/models'
import {
  generateNotionSchemaPrompt,
  validateUserIntentPrompt,
} from '@/lib/prompts'
import type { Message } from '@/types/chat'
import type {
  AIProvider,
  ChatMessage,
  SendMessageResult,
  ValidationResult,
} from '../types'

const validationSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
})

function toOpenRouterRole(role: 'user' | 'model'): 'user' | 'assistant' {
  return role === 'model' ? 'assistant' : 'user'
}

function historyToOpenRouterMessages(history: ChatMessage[]) {
  return history.map((message) => ({
    role: toOpenRouterRole(message.role),
    content: message.parts.map((part) => part.text).join('\n'),
  }))
}

function stripMarkdownCodeFence(text: string) {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match?.[1]?.trim() || trimmed
}

export function createOpenRouterProvider(): AIProvider {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }

  const openrouter = createOpenRouter({ apiKey })

  return {
    name: 'openrouter',

    async validateUserIntent(userMessage: string): Promise<ValidationResult> {
      try {
        const { object } = await generateObject({
          model: openrouter(AI_MODELS.validateUserIntent),
          system: validateUserIntentPrompt,
          prompt: userMessage,
          schema: validationSchema,
        })

        return object
      } catch (error) {
        console.error('OpenRouter validation error:', error)
        return {
          isValid: false,
          message: 'Error al procesar la validación de la solicitud.',
        }
      }
    },

    async sendUserMessage(
      history: ChatMessage[],
      userMessage: string,
    ): Promise<SendMessageResult> {
      const messages = [
        ...historyToOpenRouterMessages(history),
        { role: 'user' as const, content: userMessage },
      ]

      const { text } = await generateText({
        model: openrouter(AI_MODELS.generateNotionSchema),
        system: generateNotionSchemaPrompt,
        messages,
      })

      const responseText = stripMarkdownCodeFence(text || '')
      const updatedHistory: ChatMessage[] = [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]

      return { responseText, updatedHistory }
    },

    async normalizeChat(messages: Message[]): Promise<ChatMessage[]> {
      return messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.diagram || message.message }],
      }))
    },
  }
}
