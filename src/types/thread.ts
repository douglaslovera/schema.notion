import type { Thread } from '@/db/schema'
import type { Message } from './chat'

export type ThreadWithConversation = Thread & {
  conversation: Message[]
}

export interface ClientThread {
  chatId: string
  diagram: string
  conversation: Message[]
}

export type SidebarThread = Pick<
  Thread,
  'chatId' | 'title' | 'updatedAt' | 'isCanvasShared' | 'shareToken'
>

export interface SharedCanvasThread {
  diagram: string
}
