'use client'

import type { Thread } from '@/db/schema'

import { useEffect, useState } from 'react'

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
}

export default function PageContent({ thread, chatId }: PageContentProps) {
  const [panels, setPanels] = useState<Record<string, boolean>>({
    chat: true,
  })
  const [isMobile, setIsMobile] = useState(false)

  const { loadChatThread, chatId: storeChatId } = useChatStore()

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

  return (
    <div className="h-screen bg-background">
      <div className="h-full overflow-hidden">
        {isMobile ? (
          panels.chat ? (
            <Chat hidePanel={() => togglePanel('chat')} isMobile />
          ) : (
            <DiagramPanel
              chatPanelIsShown={false}
              isMobile
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
