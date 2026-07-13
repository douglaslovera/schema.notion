'use client'

import { AccountMenu } from '@/components/account/account-menu'
import { ChatInput } from '@/components/chat/chat-input'
import { ConversationView } from '@/components/chat/conversation-view'
import { Diagram } from '@/components/reactflow/diagram'
import { ShareCanvasButton } from '@/components/share/share-canvas-button'
import { Button } from '@/components/ui/button'
import { PENDING_STARTER_MESSAGE_PREFIX } from '@/constants/chat'
import { PATHS } from '@/constants/paths'
import type { Thread } from '@/db/schema'
import type { User } from '@/lib/auth'
import { parseNotionSchemaGraph } from '@/lib/parse-utils'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { ReactFlowProvider } from '@xyflow/react'
import {
  ArrowUpRight,
  Database,
  Eye,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type SidebarThread = {
  chatId: string
  title: string
  updatedAt: string
  updatedAtLabel: string
}

type Poc2ChatLayoutProps = {
  activeChatId: string
  thread: Thread
  threads: SidebarThread[]
  user: User
}

export default function Poc2ChatLayout({
  activeChatId,
  thread,
  threads,
  user,
}: Poc2ChatLayoutProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [chatListCollapsed, setChatListCollapsed] = useState(false)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const [diagramExpanded, setDiagramExpanded] = useState(false)
  const {
    loadChatThread,
    chatId: storeChatId,
    chatHistory,
    chatDiagram,
    isLoading,
    handleSendMessage,
  } = useChatStore()
  const processedStarterForChatIdRef = useRef<string | null>(null)
  const conversationScrollRef = useRef<HTMLDivElement>(null)
  const parsedGraph = parseNotionSchemaGraph(chatDiagram || '')
  const workspaceTitle =
    parsedGraph.workspaceName && parsedGraph.workspaceName !== 'Workspace'
      ? parsedGraph.workspaceName
      : 'Nuevo workspace'

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (
      activeChatId !== storeChatId ||
      useChatStore.getState().chatHistory === null
    ) {
      loadChatThread(activeChatId, thread)
    }
  }, [activeChatId, loadChatThread, storeChatId, thread])

  useEffect(() => {
    if (processedStarterForChatIdRef.current === activeChatId) return
    if (isLoading) return
    if (storeChatId !== activeChatId) return
    if ((chatHistory?.length || 0) > 0) return

    const key = `${PENDING_STARTER_MESSAGE_PREFIX}${activeChatId}`
    const pendingStarterMessage = sessionStorage.getItem(key)

    if (!pendingStarterMessage?.trim()) return

    processedStarterForChatIdRef.current = activeChatId
    sessionStorage.removeItem(key)
    void handleSendMessage(pendingStarterMessage, activeChatId)
  }, [activeChatId, chatHistory, handleSendMessage, isLoading, storeChatId])

  useEffect(() => {
    if (conversationScrollRef.current) {
      conversationScrollRef.current.scrollTop =
        conversationScrollRef.current.scrollHeight
    }
  })

  return (
    <div
      className={cn(
        'grid h-[100dvh] overflow-hidden bg-background text-foreground',
        chatListCollapsed
          ? 'lg:grid-cols-[minmax(0,1fr)]'
          : 'lg:grid-cols-[260px_minmax(0,1fr)]',
      )}
    >
      <aside
        className={cn(
          'min-h-0 border-r border-border/70 bg-sidebar text-sidebar-foreground',
          leftSidebarOpen
            ? 'fixed inset-0 z-[80] flex h-[100dvh] w-screen flex-col'
            : 'hidden',
          chatListCollapsed
            ? 'lg:hidden'
            : 'lg:static lg:z-auto lg:flex lg:h-auto lg:w-auto lg:flex-col',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-sidebar-border/90 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border bg-background">
              <Database className="h-4 w-4" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium tracking-tight">
                schema.notion
              </p>
              <p className="text-[11px] text-muted-foreground">Todos los chats</p>
            </div>
          </Link>

          <Button
            aria-label="Cerrar chats"
            size="icon"
            type="button"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setLeftSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-sidebar-border/90 p-3">
          <Button asChild className="w-full justify-start rounded-lg" size="sm">
            <Link href={PATHS.NEW_CHAT}>
              <Plus className="h-4 w-4" />
              Nuevo chat
            </Link>
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-auto p-2">
          <div className="space-y-1">
            {threads.map((item) => {
              const isActive = item.chatId === activeChatId

              return (
                <Link
                  key={item.chatId}
                  href={`${PATHS.CHAT}/${item.chatId}/poc-2`}
                  className={`group block rounded-lg border px-3 py-2.5 transition-colors ${
                    isActive
                      ? 'border-sidebar-border bg-background text-foreground shadow-[0_1px_0_0_var(--line-subtle)]'
                      : 'border-transparent hover:border-sidebar-border hover:bg-sidebar-accent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tracking-tight">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.updatedAtLabel}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      <main
        className={cn(
          'relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-[color:var(--surface)]',
        )}
      >
        <header className="relative z-40 border-b border-border/70 bg-background/95 px-3 py-3 backdrop-blur sm:px-5">
          <div
            className={cn(
              'mx-auto flex items-center justify-between gap-3',
              diagramOpen ? 'max-w-none' : 'max-w-4xl',
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Button
                aria-label={
                  chatListCollapsed
                    ? 'Expandir lista de chats'
                    : 'Colapsar lista de chats'
                }
                size="icon"
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => {
                  if (window.matchMedia('(min-width: 1024px)').matches) {
                    setChatListCollapsed((current) => !current)
                    return
                  }

                  setLeftSidebarOpen(true)
                }}
              >
                {chatListCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="hidden h-4 w-4 lg:block" />
                )}
                {!chatListCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 lg:hidden" />
                ) : null}
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link href={PATHS.NEW_CHAT} className="hover:text-foreground">
                    Chats
                  </Link>
                  <span>/</span>
                  <span>Conversation POC</span>
                </div>
                <h1 className="truncate text-sm font-medium tracking-tight sm:text-base">
                  {workspaceTitle}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasMounted ? (
                <>
                  <ShareCanvasButton
                    chatId={activeChatId}
                    schemaJson={chatDiagram}
                    disabled={!chatDiagram || isLoading}
                  />
                  <AccountMenu user={user} />
                </>
              ) : (
                <div className="h-9 w-28" aria-hidden="true" />
              )}
            </div>
          </div>
        </header>

        <section
          className={cn(
            'min-h-0 overflow-hidden',
            diagramOpen && !diagramExpanded
              ? 'lg:grid lg:grid-cols-[minmax(320px,30%)_minmax(0,70%)]'
              : '',
          )}
        >
          <div
            className={cn(
              'min-h-0',
              diagramOpen
                ? cn(
                    'hidden border-r border-border/70',
                    diagramExpanded
                      ? 'lg:hidden'
                      : 'lg:grid lg:grid-rows-[minmax(0,1fr)_auto]',
                  )
                : 'grid h-full grid-rows-[minmax(0,1fr)_auto]',
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                ref={conversationScrollRef}
                className="mx-auto h-full max-w-4xl overflow-auto px-3 py-5 sm:px-5"
              >
                <ConversationView />
              </div>
            </div>

            <footer className="relative z-40 border-t border-border/70 bg-background px-3 py-3 sm:px-5">
              <div className="mx-auto max-w-4xl">
                <ChatInput />
              </div>
            </footer>
          </div>

          {diagramOpen ? (
            <div className="relative h-full min-h-0 overflow-hidden subtle-canvas">
              <Button
                aria-label={
                  diagramExpanded ? 'Contraer diagrama' : 'Expandir diagrama'
                }
                type="button"
                className="absolute left-4 top-4 z-30 rounded-full shadow-lg"
                size="icon"
                variant="secondary"
                onClick={() => setDiagramExpanded((current) => !current)}
              >
                {diagramExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {isLoading ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
                  <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                    Generando esquema...
                  </div>
                </div>
              ) : null}

              {!chatDiagram && !isLoading ? (
                <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-4">
                  <div className="max-w-md rounded-xl border border-border/80 bg-card/90 p-5 text-center shadow-[0_1px_0_0_var(--line-subtle)] backdrop-blur">
                    <Eye className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-base font-medium tracking-tight">
                      Aún no hay diagrama
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Vuelve al chat y continúa la conversación para generar el
                      canvas de estructura.
                    </p>
                  </div>
                </div>
              ) : null}

              <ReactFlowProvider>
                <Diagram />
              </ReactFlowProvider>
            </div>
          ) : null}
        </section>

        <Button
          aria-label={diagramOpen ? 'Cerrar diagrama' : 'Mostrar diagrama'}
          type="button"
          className="fixed right-4 top-[72px] z-[75] rounded-full shadow-lg sm:right-6"
          size="sm"
          onClick={() => {
            setDiagramOpen((current) => {
              if (current) {
                setDiagramExpanded(false)
              }

              return !current
            })
          }}
        >
          {diagramOpen ? (
            <>
              <MessageSquareText className="h-4 w-4" />
              Cerrar
            </>
          ) : (
            <>
              <Network className="h-4 w-4" />
              Diagrama
            </>
          )}
        </Button>

      </main>
    </div>
  )
}
