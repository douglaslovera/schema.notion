import type { Message } from '@/types/chat'

/**
 * Roles used internally by the AI service.
 */
export type ChatRole = 'user' | 'model'

/**
 * A single message in the application chat history.
 */
export interface ChatMessage {
  role: ChatRole
  parts: { text: string }[]
}

/**
 * Result of validating whether a user's message is a legitimate
 * database-related request.
 */
export interface ValidationResult {
  isValid: boolean
  message: string
}

/**
 * Result of sending a user message to the main schema-generation model.
 */
export interface SendMessageResult {
  responseText: string
  updatedHistory: ChatMessage[]
}

/**
 * The AI capabilities used by the application.
 */
export interface AIProvider {
  /** Human-readable name for logging / debugging */
  readonly name: string

  /**
   * Determine if the user's message is a valid database-related request.
   * Should return { isValid: false, message } for greetings, noise, etc.
   */
  validateUserIntent(userMessage: string): Promise<ValidationResult>

  /**
   * Main schema generation. Sends the full conversation history
   * plus a new user message, returns the AI's JSON schema response
   * and the updated history.
   */
  sendUserMessage(
    history: ChatMessage[],
    userMessage: string,
  ): Promise<SendMessageResult>

  /**
   * Convert the app's internal Message[] format into the
   * ChatMessage[] format used for history replay.
   */
  normalizeChat(messages: Message[]): Promise<ChatMessage[]>

}
