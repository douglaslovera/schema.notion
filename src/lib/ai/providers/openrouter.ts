import { AI_MODELS } from '@/lib/ai/models'
import {
  generateNotionSchemaPrompt,
  validateUserIntentPrompt,
} from '@/lib/prompts'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
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

type OpenRouterMessage = {
  role: 'user' | 'assistant'
  content: string
}

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
      } catch {
        console.error('OpenRouter validation failed')
        return {
          isValid: false,
          message: 'Error al procesar la validación de la solicitud.',
        }
      }
    },

    async generateSchema(
      history: ChatMessage[],
      userMessage: string,
      currentDiagram: string,
    ): Promise<SendMessageResult> {
      // The current diagram is replayed as the model's own last output so it can
      // amend it directly. It is sent once per request, never once per turn.
      const diagramContext: OpenRouterMessage[] = currentDiagram
        ? [{ role: 'assistant', content: currentDiagram }]
        : []

      const messages: OpenRouterMessage[] = [
        ...historyToOpenRouterMessages(history),
        ...diagramContext,
        { role: 'user', content: userMessage },
      ]

      const { text } = await generateText({
        model: openrouter(AI_MODELS.generateNotionSchema),
        system: generateNotionSchemaPrompt,
        messages,
      })

      return { responseText: stripMarkdownCodeFence(text || '') }
    },
  }
}
