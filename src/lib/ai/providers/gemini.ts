import {
  generateNotionSchemaPrompt,
  validateUserIntentPrompt,
} from '@/lib/prompts'
import type { Message } from '@/types/chat'
import { GoogleGenAI } from '@google/genai'
import type {
  AIProvider,
  ChatMessage,
  SendMessageResult,
  ValidationResult,
} from '../types'

const MAIN_MODEL = 'gemini-2.5-flash-preview-04-17'
const MISC_MODEL = 'gemini-2.0-flash'

export function createGeminiProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const ai = new GoogleGenAI({ apiKey })

  return {
    name: 'gemini',

    async validateUserIntent(userMessage: string): Promise<ValidationResult> {
      const response = await ai.models.generateContent({
        model: MISC_MODEL,
        contents: userMessage,
        config: {
          systemInstruction: {
            role: 'user',
            parts: [{ text: validateUserIntentPrompt }],
          },
          responseMimeType: 'application/json',
        },
      })

      const text = response?.text
      if (text) {
        try {
          return JSON.parse(text) as ValidationResult
        } catch (error) {
          console.error('Error parsing validation response:', error)
          return {
            isValid: false,
            message: 'Error al procesar la validación de la solicitud.',
          }
        }
      }
      return {
        isValid: false,
        message: 'No se recibió respuesta del servicio de validación.',
      }
    },

    async sendUserMessage(
      history: ChatMessage[],
      userMessage: string,
    ): Promise<SendMessageResult> {
      const chat = ai.chats.create({
        model: MAIN_MODEL,
        history,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: {
            role: 'user',
            parts: [{ text: generateNotionSchemaPrompt }],
          },
        },
      })
      const response = await chat.sendMessage({ message: userMessage })
      const responseText = response.text || ''
      const updatedHistory = chat.getHistory() as ChatMessage[]
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
