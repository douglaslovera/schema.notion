'use client'

import { PENDING_STARTER_MESSAGE_PREFIX } from '@/constants/chat'
import type { Thread } from '@/db/schema'
import type { User } from '@/lib/auth'

import { useEffect, useRef, useState } from 'react'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

import { useChatStore } from '@/stores/chat'
import Chat from '../sections/chat-panel'
import DiagramPanel from '../sections/diagram-panel'

type PageContentProps = {
  thread: Thread | null
  chatId: string
  user: User
}

export default function PageContent({
  thread,
  chatId,
  user,
}: PageContentProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [panels, setPanels] = useState<Record<string, boolean>>({
    chat: true,
  })
  const [isMobile, setIsMobile] = useState(false)

  const {
    loadChatThread,
    chatId: storeChatId,
    chatHistory,
    isLoading,
    handleSendMessage,
  } = useChatStore()
  const processedStarterForChatIdRef = useRef<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (chatId) {
      if (
        chatId !== storeChatId ||
        useChatStore.getState().chatHistory === null
      ) {
        loadChatThread(chatId, thread)
      }
    }
  }, [chatId, loadChatThread, storeChatId])

  useEffect(() => {
    if (processedStarterForChatIdRef.current === chatId) return
    if (isLoading) return
    if (storeChatId !== chatId) return
    if ((chatHistory?.length || 0) > 0) return

    const key = `${PENDING_STARTER_MESSAGE_PREFIX}${chatId}`
    const pendingStarterMessage = sessionStorage.getItem(key)

    if (!pendingStarterMessage?.trim()) return

    processedStarterForChatIdRef.current = chatId
    sessionStorage.removeItem(key)
    void handleSendMessage(pendingStarterMessage, chatId)
  }, [chatHistory, chatId, handleSendMessage, isLoading, storeChatId])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const syncMobileState = () => {
      setIsMobile(mediaQuery.matches)
      if (mediaQuery.matches) {
        setPanels((prev) => ({ ...prev, chat: false }))
      }
    }

    syncMobileState()
    mediaQuery.addEventListener('change', syncMobileState)
    return () => mediaQuery.removeEventListener('change', syncMobileState)
  }, [])

  const togglePanel = (panel: string) => {
    setPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }))
  }

  if (!hasMounted) {
    return <div className="h-screen bg-background" />
  }

  return (
    <div className="h-screen bg-background">
      <div className="h-full overflow-hidden">
        {isMobile ? (
          panels.chat ? (
            <Chat hidePanel={() => togglePanel('chat')} isMobile />
          ) : (
            <DiagramPanel
              chatPanelIsShown={false}
              chatId={chatId}
              isMobile
              user={user}
              toggleChatPanel={(show) =>
                setPanels((prev) => ({ ...prev, chat: show }))
              }
            />
          )
        ) : (
          <ResizablePanelGroup direction="horizontal">
            {panels.chat && (
              <>
                <ResizablePanel defaultSize={28} minSize={22} maxSize={42}>
                  <Chat hidePanel={() => togglePanel('chat')} />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            <ResizablePanel defaultSize={panels.chat ? 72 : 100}>
              <DiagramPanel
                chatPanelIsShown={panels.chat}
                chatId={chatId}
                user={user}
                toggleChatPanel={(show) =>
                  setPanels((prev) => ({ ...prev, chat: show }))
                }
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  )
}
