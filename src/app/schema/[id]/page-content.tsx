'use client'

import type { Thread } from '@/db/schema'

import { useEffect } from 'react'
import { useState } from 'react'

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

  const togglePanel = (panel: string) => {
    setPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {panels.chat && (
            <>
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <Chat hidePanel={() => togglePanel('chat')} />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel defaultSize={70}>
            <DiagramPanel
              chatPanelIsShown={panels.chat}
              toggleChatPanel={(show) =>
                setPanels((prev) => ({ ...prev, chat: show }))
              }
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
