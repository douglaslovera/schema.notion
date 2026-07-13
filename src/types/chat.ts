export type Roles = 'user' | 'model'

export interface MessageRole {
  user: 'user'
  assistant: 'model'
}

export interface Message {
  id: string
  timestamp: number
  role: Roles
  diagram: string
  message: string
}

export interface Conversation {
  id: string
  title: string
  description: string
  diagram: Record<string, unknown>
  messages: Message[]
}

export interface ConversationHistory extends Message {}
