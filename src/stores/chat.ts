'use client'

import type { Thread } from '@/db/schema'
import { normalizeChat, sendUserMessage, validateUserIntent } from '@/lib/ai'
import { saveThreadForCurrentUser } from '@/lib/thread'
import type { Message, Roles } from '@/types/chat'
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
  diagramNodePositionsByChatId: Record<
    string,
    Record<string, { x: number; y: number }>
  >
  isLoading: boolean

  addMessageToChat: (role: Roles, text: string, diagram?: string) => void
  handleSendMessage: (messageText: string, chatId: string) => Promise<void>
  loadChatThread: (chatId: string, thread: Thread | null) => Promise<void>
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
      diagramNodePositionsByChatId: {},
      isLoading: false,

      addMessageToChat: (role: Roles, text: string, diagram?: string) => {
        const { chatHistory } = get()
        const newMessage: Message = {
          id: Date.now().toString(),
          role,
          message: text, // Textual content (e.g., user query, AI summary)
          diagram: diagram || '', // Diagram JSON string, if this message includes/is a diagram
          timestamp: Date.now(),
        }
        set({ chatHistory: [...(chatHistory || []), newMessage] })
      },

      handleSendMessage: async (messageText: string, chatId: string) => {
        const {
          addMessageToChat,
          chatHistory: currentLocalHistory,
          chatDiagram: currentDiagramInStore,
        } = get()

        addMessageToChat(ROLES.user, messageText)
        set({ isLoading: true, chatId })

        // <<< VALIDAR INTENCIÓN DEL USUARIO
        const validationResult = await validateUserIntent(messageText)
        if (!validationResult.isValid) {
          addMessageToChat(ROLES.assistant, validationResult.message)
          set({ isLoading: false })
          return
        }
        // >>> FIN VALIDACIÓN

        const normalizedHistory = await normalizeChat(currentLocalHistory || [])

        try {
          const { responseText: aiDiagramResponse } = await sendUserMessage(
            normalizedHistory,
            messageText,
          )

          let summaryForChatMessage =
            'No se detectaron cambios estructurales en la propuesta de Notion.'
          if (!currentDiagramInStore && aiDiagramResponse) {
            summaryForChatMessage =
              'He generado la primera propuesta de bases de datos de Notion según tu solicitud.'
          } else if (
            currentDiagramInStore &&
            aiDiagramResponse &&
            currentDiagramInStore !== aiDiagramResponse
          ) {
            summaryForChatMessage =
              'Actualicé la estructura de bases de datos de Notion con los cambios que pediste.'
          }

          addMessageToChat(
            ROLES.assistant,
            summaryForChatMessage,
            aiDiagramResponse,
          )

          set({ chatDiagram: aiDiagramResponse })

          try {
            await saveThreadForCurrentUser({
              chatId,
              diagram: aiDiagramResponse,
              conversation: get().chatHistory || [],
            })
          } catch (error) {
            console.error('Error saving thread:', error)
            addMessageToChat(
              ROLES.assistant,
              'Generé la respuesta, pero no pude guardar este chat. Revisa la base de datos e inténtalo de nuevo.',
            )
          }
        } catch (error) {
          console.error('Error sending message:', error)
          addMessageToChat(
            ROLES.assistant,
            `Sorry, I encountered an error while generating the response: ${(error as Error).message}`,
          )
        } finally {
          set({ isLoading: false })
        }
      },

      loadChatThread: async (chatId: string, thread: Thread | null) => {
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
    },
  ),
)
