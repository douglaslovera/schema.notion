import { createGroq } from '@ai-sdk/groq'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'
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

const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

const validationSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
})

function toGroqRole(role: 'user' | 'model'): 'user' | 'assistant' {
  return role === 'model' ? 'assistant' : 'user'
}

function historyToGroqMessages(history: ChatMessage[]) {
  return history.map((msg) => ({
    role: toGroqRole(msg.role),
    content: msg.parts.map((part) => part.text).join('\n'),
  }))
}

function stripMarkdownCodeFence(text: string) {
  const trimmed = text.trim()
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match?.[1]?.trim() || trimmed
}

export function createGroqProvider(): AIProvider {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }

  const groqProvider = createGroq({
    apiKey,
    baseURL: process.env.GROQ_BASE_URL,
  })

  const mainModel = process.env.GROQ_MAIN_MODEL || DEFAULT_MODEL
  const miscModel = process.env.GROQ_MISC_MODEL || mainModel

  return {
    name: 'groq',

    async validateUserIntent(userMessage: string): Promise<ValidationResult> {
      try {
        const { object } = await generateObject({
          model: groqProvider(miscModel),
          system: validateUserIntentPrompt,
          prompt: userMessage,
          schema: validationSchema,
          providerOptions: {
            groq: {
              structuredOutputs: false,
            },
          },
        })

        return object
      } catch (error) {
        console.error('Groq validation error:', error)
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
        ...historyToGroqMessages(history),
        { role: 'user' as const, content: userMessage },
      ]

      const { text } = await generateText({
        model: groqProvider(mainModel),
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
      return messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.diagram || msg.message }],
      }))
    },
  }
}
