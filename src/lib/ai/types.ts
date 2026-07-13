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
   * Main schema generation. Receives the conversation as plain text plus the
   * single current diagram, and returns the AI's JSON schema response.
   *
   * `history` must not carry diagram snapshots: only the latest diagram is
   * relevant to the model, and replaying every past version grows the context
   * quadratically with the length of the conversation.
   */
  generateSchema(
    history: ChatMessage[],
    userMessage: string,
    currentDiagram: string,
  ): Promise<SendMessageResult>
}
