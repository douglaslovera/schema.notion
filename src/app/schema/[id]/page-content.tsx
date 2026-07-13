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
  Database,
  Eye,
  House,
  LoaderCircle,
  Maximize2,
  MessageSquareText,
  MessagesSquare,
  Minimize2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
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

type PageContentProps = {
  activeChatId: string
  thread: Thread
  threads: SidebarThread[]
  user: User
}

export default function PageContent({
  activeChatId,
  thread,
  threads,
  user,
}: PageContentProps) {
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
    pendingNavigationChatId: pendingChatId,
    setPendingNavigationChatId: setPendingChatId,
  } = useChatStore()
  const processedStarterForChatIdRef = useRef<string | null>(null)
  const conversationScrollRef = useRef<HTMLDivElement>(null)
  const parsedGraph = parseNotionSchemaGraph(chatDiagram || '')
  const workspaceTitle =
    parsedGraph.workspaceName && parsedGraph.workspaceName !== 'Workspace'
      ? parsedGraph.workspaceName
      : 'Nuevo workspace'
  const displayedChatTitle =
    threads.find(
      (item) => item.chatId === (pendingChatId || activeChatId),
    )?.title || workspaceTitle

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (pendingChatId === activeChatId && storeChatId === activeChatId) {
      setPendingChatId(null)
    }
  }, [activeChatId, pendingChatId, setPendingChatId, storeChatId])

  useEffect(() => {
    if (pendingChatId && pendingChatId !== activeChatId) return

    if (
      activeChatId !== storeChatId ||
      useChatStore.getState().chatHistory === null
    ) {
      loadChatThread(activeChatId, thread)
    }
  }, [activeChatId, loadChatThread, pendingChatId, storeChatId, thread])

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
        'grid h-[100dvh] overflow-hidden bg-[color:var(--surface-muted)] text-foreground lg:transition-[grid-template-columns] lg:duration-300 lg:ease-out',
        chatListCollapsed
          ? 'lg:grid-cols-[0px_minmax(0,1fr)]'
          : 'lg:grid-cols-[300px_minmax(0,1fr)]',
      )}
    >
      <aside
        className={cn(
          'min-h-0 bg-transparent p-2 text-sidebar-foreground',
          leftSidebarOpen
            ? 'fixed inset-0 z-[80] flex h-[100dvh] w-screen flex-col'
            : 'hidden',
          'lg:static lg:z-auto lg:flex lg:h-auto lg:w-auto lg:flex-col lg:transition-[opacity,transform] lg:duration-200 lg:ease-out',
          chatListCollapsed
            ? 'lg:pointer-events-none lg:-translate-x-3 lg:opacity-0'
            : 'lg:translate-x-0 lg:opacity-100',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-sidebar-border/90 bg-sidebar shadow-[0_18px_50px_color-mix(in_oklab,var(--foreground)_8%,transparent)] lg:rounded-2xl">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Database className="h-4 w-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold tracking-tight">
                  schema.notion
                </p>
                <p className="text-[11px] text-muted-foreground">Workspace</p>
              </div>
            </Link>

            <Button
              aria-label={
                leftSidebarOpen ? 'Cerrar chats' : 'Colapsar lista de chats'
              }
              size="icon"
              type="button"
              variant="ghost"
              className="size-8 rounded-lg"
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) {
                  setChatListCollapsed(true)
                  return
                }

                setLeftSidebarOpen(false)
              }}
            >
              <PanelLeftClose className="hidden h-4 w-4 lg:block" />
              <X className="h-4 w-4 lg:hidden" />
            </Button>
          </div>

          <nav className="px-2.5 pb-3">
          <div className="space-y-1">
            <Link
              href="/"
              className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <House className="size-4" />
              Inicio
            </Link>
            <Link
              href={PATHS.SCHEMAS}
              className="flex h-9 items-center gap-3 rounded-lg bg-sidebar-accent px-3 text-sm font-medium text-foreground"
            >
              <MessagesSquare className="size-4" />
              Chats
            </Link>
          </div>
          </nav>

          <div className="border-y border-sidebar-border/70 p-3">
          <Button asChild className="w-full justify-start rounded-lg" size="sm">
            <Link href={PATHS.CHAT}>
              <Plus className="h-4 w-4" />
              Nuevo chat
            </Link>
          </Button>
          </div>

          <nav className="min-h-0 flex-1 overflow-auto p-2">
          <div className="space-y-1">
            {threads.map((item) => {
              const isActive = item.chatId === (pendingChatId || activeChatId)

              return (
                <Link
                  key={item.chatId}
                  href={`${PATHS.CHAT}/${item.chatId}`}
                  title={item.title}
                  onNavigate={() => {
                    if (item.chatId !== activeChatId) {
                      setPendingChatId(item.chatId)
                    }
                  }}
                  className={`group block rounded-lg border px-2.5 py-2 transition-colors ${
                    isActive
                      ? 'border-sidebar-border bg-background text-foreground shadow-[0_1px_0_0_var(--line-subtle)]'
                      : 'border-transparent hover:border-sidebar-border hover:bg-sidebar-accent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="size-3.5 shrink-0 text-muted-foreground" />
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight">
                      {item.title}
                    </p>
                    <time
                      dateTime={item.updatedAt}
                      className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                    >
                      {item.updatedAtLabel}
                    </time>
                  </div>
                </Link>
              )
            })}
          </div>
          </nav>

          <div className="border-t border-sidebar-border/70 p-2.5">
          <button
            type="button"
            className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <Settings className="size-4" />
            Configuración
          </button>
          </div>
        </div>
      </aside>

      <main className="relative grid min-h-0 grid-rows-[auto_minmax(0,1fr)] bg-transparent">
        <header className="relative z-40 bg-transparent px-3 py-2 sm:px-4">
          <div
            className={cn(
              'flex items-center justify-between gap-3',
            )}
          >
            <div className="flex h-14 min-w-0 items-center gap-2 rounded-xl border border-border/80 bg-card/90 px-2.5 shadow-sm backdrop-blur">
              <Button
                aria-label={
                  chatListCollapsed
                    ? 'Expandir lista de chats'
                    : 'Colapsar lista de chats'
                }
                size="icon"
                type="button"
                variant="outline"
                className={cn(
                  'shrink-0',
                  chatListCollapsed &&
                    'lg:animate-in lg:fade-in lg:zoom-in-95 lg:duration-200',
                  !chatListCollapsed && 'lg:hidden',
                )}
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
                  <Link href={PATHS.SCHEMAS} className="hover:text-foreground">
                    Chats
                  </Link>
                  <span>/</span>
                  <span>Workspace</span>
                </div>
                <h1 className="truncate text-sm font-medium tracking-tight sm:text-base">
                  {displayedChatTitle}
                </h1>
              </div>
            </div>

            <div className="flex h-14 shrink-0 items-center gap-1.5 rounded-xl border border-border/80 bg-card/90 px-1.5 shadow-sm backdrop-blur">
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
                aria-busy={pendingChatId !== null}
              >
                {pendingChatId ? (
                  <div className="flex h-full min-h-52 items-end justify-center pb-2">
                    <LoaderCircle
                      className="size-6 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Abriendo chat...</span>
                  </div>
                ) : (
                  <ConversationView />
                )}
              </div>
            </div>

            <footer className="relative z-40 bg-transparent px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
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
