'use client'

import { sendChatMessage } from '@/lib/chat-actions'
import type { Message, Roles } from '@/types/chat'
import type { ClientThread } from '@/types/thread'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const ROLES: Record<string, Roles> = {
  user: 'user',
  assistant: 'model',
}

interface ChatStore {
  conversations: string[]
  chatHistory: Message[] | null
  chatId: string | null
  chatDiagram: string | null
  pendingNavigationChatId: string | null
  diagramNodePositionsByChatId: Record<
    string,
    Record<string, { x: number; y: number }>
  >
  isLoading: boolean

  addMessageToChat: (role: Roles, text: string, diagram?: string) => void
  handleSendMessage: (messageText: string, chatId: string) => Promise<void>
  loadChatThread: (chatId: string, thread: ClientThread | null) => Promise<void>
  setPendingNavigationChatId: (chatId: string | null) => void
  setDiagramNodePositions: (
    chatId: string,
    positions: Record<string, { x: number; y: number }>,
  ) => void
  mergeDiagramNodePositions: (
    chatId: string,
    positions: Record<string, { x: number; y: number }>,
  ) => void
  pruneDiagramNodePositions: (chatId: string, validNodeIds: string[]) => void
  clearDiagramNodePositions: (chatId: string) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      chatHistory: null,
      chatId: null,
      chatDiagram: null,
      pendingNavigationChatId: null,
      diagramNodePositionsByChatId: {},
      isLoading: false,

      setPendingNavigationChatId: (chatId) => {
        set({ pendingNavigationChatId: chatId })
      },

      addMessageToChat: (role: Roles, text: string, diagram?: string) => {
        const { chatHistory } = get()
        const newMessage: Message = {
          id: crypto.randomUUID(),
          role,
          message: text, // Textual content (e.g., user query, AI summary)
          diagram: diagram || '', // Diagram JSON string, if this message includes/is a diagram
          timestamp: Date.now(),
        }
        set({ chatHistory: [...(chatHistory || []), newMessage] })
      },

      handleSendMessage: async (messageText: string, chatId: string) => {
        const { addMessageToChat } = get()

        // Shown immediately; the server stores it under this same id, so the
        // optimistic message and the persisted one stay in sync.
        const clientMessageId = crypto.randomUUID()
        const optimisticMessage: Message = {
          id: clientMessageId,
          role: ROLES.user,
          message: messageText,
          diagram: '',
          timestamp: Date.now(),
        }

        set((state) => ({
          chatHistory: [...(state.chatHistory || []), optimisticMessage],
          isLoading: true,
          chatId,
        }))

        try {
          const { assistantMessage, diagram } = await sendChatMessage({
            chatId,
            clientMessageId,
            message: messageText,
          })

          set((state) => ({
            chatHistory: [...(state.chatHistory || []), assistantMessage],
            chatDiagram: diagram || null,
          }))
        } catch (error) {
          console.error('Error sending message:', error)
          // The user's message is already persisted server-side; this notice is
          // transient and is not written to the thread.
          addMessageToChat(
            ROLES.assistant,
            'No pude generar la respuesta. Inténtalo de nuevo.',
          )
        } finally {
          set({ isLoading: false })
        }
      },

      loadChatThread: async (chatId: string, thread: ClientThread | null) => {
        set({ isLoading: true })
        try {
          if (thread) {
            set({
              chatId: thread.chatId,
              chatHistory: thread.conversation as Message[],
              chatDiagram: thread.diagram,
              isLoading: false,
            })
          } else {
            set({
              chatId,
              chatHistory: [],
              chatDiagram: null,
              isLoading: false,
            })
            // const randomIndex = Math.floor(Math.random() * defaultMessages.length)
            // addMessageToChat(ROLES.assistant, defaultMessages[randomIndex])
          }
        } catch (error) {
          console.error('Error loading chat thread:', error)
          set({
            chatId,
            chatHistory: [],
            chatDiagram: null,
            isLoading: false,
          })
        }
      },

      setDiagramNodePositions: (chatId, positions) => {
        set((state) => ({
          diagramNodePositionsByChatId: {
            ...state.diagramNodePositionsByChatId,
            [chatId]: positions,
          },
        }))
      },

      mergeDiagramNodePositions: (chatId, positions) => {
        set((state) => ({
          diagramNodePositionsByChatId: {
            ...state.diagramNodePositionsByChatId,
            [chatId]: {
              ...(state.diagramNodePositionsByChatId[chatId] || {}),
              ...positions,
            },
          },
        }))
      },

      pruneDiagramNodePositions: (chatId, validNodeIds) => {
        set((state) => {
          const currentPositions = state.diagramNodePositionsByChatId[chatId]
          if (!currentPositions) return state

          const validIds = new Set(validNodeIds)
          const nextPositions = Object.fromEntries(
            Object.entries(currentPositions).filter(([nodeId]) =>
              validIds.has(nodeId),
            ),
          )

          if (
            Object.keys(nextPositions).length ===
            Object.keys(currentPositions).length
          ) {
            return state
          }

          return {
            diagramNodePositionsByChatId: {
              ...state.diagramNodePositionsByChatId,
              [chatId]: nextPositions,
            },
          }
        })
      },

      clearDiagramNodePositions: (chatId) => {
        set((state) => {
          if (!(chatId in state.diagramNodePositionsByChatId)) {
            return state
          }

          const next = { ...state.diagramNodePositionsByChatId }
          delete next[chatId]

          return {
            diagramNodePositionsByChatId: next,
          }
        })
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => sessionStorage),
      // isLoading is deliberately not persisted: a tab closed mid-request would
      // otherwise rehydrate stuck in a loading state.
      partialize: (state) => ({
        conversations: state.conversations,
        chatHistory: state.chatHistory,
        chatId: state.chatId,
        chatDiagram: state.chatDiagram,
        diagramNodePositionsByChatId: state.diagramNodePositionsByChatId,
      }),
    },
  ),
)
