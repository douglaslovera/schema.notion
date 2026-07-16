'use client'

import { AccountMenu } from '@/components/account/account-menu'
import { ChatInput } from '@/components/chat/chat-input'
import { ConversationView } from '@/components/chat/conversation-view'
import { NewChatLink } from '@/components/chat/new-chat-link'
import { SharedChatsModal } from '@/components/chat/shared-chats-modal'
import { Diagram } from '@/components/reactflow/diagram'
import { ShareCanvasButton } from '@/components/share/share-canvas-button'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { PENDING_STARTER_MESSAGE_PREFIX } from '@/constants/chat'
import { PATHS } from '@/constants/paths'
import { parseNotionSchemaGraph } from '@/lib/parse-utils'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { useConfigStore } from '@/stores/config'
import type { User } from '@/types/auth'
import type { ClientThread } from '@/types/thread'
import { ReactFlowProvider } from '@xyflow/react'
import {
  Database,
  Eye,
  LoaderCircle,
  Maximize2,
  MessageSquareText,
  Minimize2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Share2,
  Settings,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type SidebarThread = {
  chatId: string
  title: string
  updatedAt: string
  updatedAtLabel: string
  groupLabel: string
  isCanvasShared: boolean
  shareToken: string | null
}

type PageContentProps = {
  serverChatId: string
  thread: ClientThread | null
  threads: SidebarThread[]
  user: User
}

export default function PageContent({
  serverChatId,
  thread,
  threads,
  user,
}: PageContentProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [diagramSidebarPreviewOpen, setDiagramSidebarPreviewOpen] =
    useState(false)
  const [diagramSidebarPreviewRendered, setDiagramSidebarPreviewRendered] =
    useState(false)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const [diagramRendered, setDiagramRendered] = useState(false)
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
  // The active chat is read from the URL rather than the server prop so that a
  // client-side "new chat" (which pushes a URL without an RSC render) is
  // reflected. serverChatId still identifies which chat `thread` belongs to.
  const pathname = usePathname()
  const activeChatId = pathname.startsWith(`${PATHS.CHAT}/`)
    ? pathname.slice(PATHS.CHAT.length + 1)
    : serverChatId
  const activeThread = serverChatId === activeChatId ? thread : null
  const { chatListCollapsed, setChatListCollapsed } = useConfigStore()
  const processedStarterForChatIdRef = useRef<string | null>(null)
  const conversationScrollRef = useRef<HTMLDivElement>(null)
  const diagramCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const diagramSidebarPreviewTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null)
  const parsedGraph = parseNotionSchemaGraph(chatDiagram || '')
  const workspaceTitle =
    parsedGraph.workspaceName && parsedGraph.workspaceName !== 'Workspace'
      ? parsedGraph.workspaceName
      : 'Nuevo workspace'
  const displayedChatTitle =
    threads.find(
      (item) => item.chatId === (pendingChatId || activeChatId),
    )?.title || (pendingChatId ? 'Nuevo workspace' : workspaceTitle)

  useEffect(() => {
    setHasMounted(true)

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const updateDesktopState = () => setIsDesktop(desktopQuery.matches)

    updateDesktopState()
    desktopQuery.addEventListener('change', updateDesktopState)

    return () => {
      desktopQuery.removeEventListener('change', updateDesktopState)

      if (diagramCloseTimeoutRef.current) {
        clearTimeout(diagramCloseTimeoutRef.current)
      }

      if (diagramSidebarPreviewTimeoutRef.current) {
        clearTimeout(diagramSidebarPreviewTimeoutRef.current)
      }
    }
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
      loadChatThread(activeChatId, activeThread)
    }
  }, [activeChatId, activeThread, loadChatThread, pendingChatId, storeChatId])

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

  const showDiagramSidebarPreview = () => {
    if (diagramSidebarPreviewTimeoutRef.current) {
      clearTimeout(diagramSidebarPreviewTimeoutRef.current)
      diagramSidebarPreviewTimeoutRef.current = null
    }

    setDiagramSidebarPreviewRendered(true)
    setDiagramSidebarPreviewOpen(true)
  }

  const hideDiagramSidebarPreview = () => {
    setDiagramSidebarPreviewOpen(false)

    if (diagramSidebarPreviewTimeoutRef.current) {
      clearTimeout(diagramSidebarPreviewTimeoutRef.current)
    }

    diagramSidebarPreviewTimeoutRef.current = setTimeout(() => {
      setDiagramSidebarPreviewRendered(false)
      diagramSidebarPreviewTimeoutRef.current = null
    }, 200)
  }

  const resetDiagramSidebarPreview = () => {
    if (diagramSidebarPreviewTimeoutRef.current) {
      clearTimeout(diagramSidebarPreviewTimeoutRef.current)
      diagramSidebarPreviewTimeoutRef.current = null
    }

    setDiagramSidebarPreviewOpen(false)
    setDiagramSidebarPreviewRendered(false)
  }

  const openDiagram = () => {
    if (diagramCloseTimeoutRef.current) {
      clearTimeout(diagramCloseTimeoutRef.current)
      diagramCloseTimeoutRef.current = null
    }

    setDiagramRendered(true)
    setDiagramOpen(true)
    setDiagramExpanded(false)
    setChatListCollapsed(true)
    setLeftSidebarOpen(false)
    resetDiagramSidebarPreview()
  }

  const closeDiagram = () => {
    setDiagramOpen(false)
    resetDiagramSidebarPreview()

    if (diagramCloseTimeoutRef.current) {
      clearTimeout(diagramCloseTimeoutRef.current)
    }

    diagramCloseTimeoutRef.current = setTimeout(() => {
      setDiagramRendered(false)
      setDiagramExpanded(false)
      diagramCloseTimeoutRef.current = null
    }, 300)
  }

  const diagramMotionClass = diagramOpen
    ? 'animate-in fade-in slide-in-from-right-4 duration-300'
    : 'pointer-events-none animate-out fade-out slide-out-to-right-4 duration-300'

  const chatPane = (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
      <div className="min-h-0 overflow-hidden">
        <div
          ref={conversationScrollRef}
          className="h-full overflow-auto px-3 py-5 sm:px-6"
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

      <footer className="relative z-40 bg-gradient-to-t from-[color:var(--surface-muted)] via-[color:var(--surface-muted)] to-transparent px-3 pb-3 pt-3 sm:px-6 sm:pb-5 sm:pt-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput />
        </div>
      </footer>
    </div>
  )

  const diagramPane = (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-border/90 bg-background shadow-[0_18px_50px_color-mix(in_oklab,var(--foreground)_8%,transparent)] subtle-canvas">
      <Button
        aria-label={diagramExpanded ? 'Contraer diagrama' : 'Expandir diagrama'}
        type="button"
        className="absolute left-3 top-3 z-30 rounded-full shadow-lg"
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
              Vuelve al chat y continúa la conversación para generar el canvas
              de estructura.
            </p>
          </div>
        </div>
      ) : null}

      <ReactFlowProvider>
        <Diagram />
      </ReactFlowProvider>
    </div>
  )

  return (
    <div
      onPointerMove={(event) => {
        if (
          diagramSidebarPreviewOpen &&
          (event.clientX > 300 || event.clientY < 84)
        ) {
          hideDiagramSidebarPreview()
        }
      }}
      className={cn(
        'grid h-[100dvh] grid-cols-[minmax(0,1fr)] overflow-hidden bg-[color:var(--surface-muted)] text-foreground lg:transition-[grid-template-columns] lg:duration-300 lg:ease-out',
        chatListCollapsed
          ? 'lg:grid-cols-[0px_minmax(0,1fr)]'
          : 'lg:grid-cols-[300px_minmax(0,1fr)]',
      )}
    >
      <div
        className={cn(
          'min-h-0',
          leftSidebarOpen
            ? 'fixed inset-0 z-[80] flex h-[100dvh] w-screen flex-col'
            : 'hidden',
          'lg:static lg:z-auto lg:flex lg:h-auto lg:w-auto lg:flex-col',
        )}
      >
      <div
        onPointerEnter={() => {
          if (chatListCollapsed) {
            showDiagramSidebarPreview()
          }
        }}
        onPointerMove={() => {
          if (chatListCollapsed && !diagramSidebarPreviewOpen) {
            showDiagramSidebarPreview()
          }
        }}
        onPointerLeave={hideDiagramSidebarPreview}
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          chatListCollapsed
            ? cn(
                'lg:fixed lg:bottom-0 lg:left-0 lg:top-[84px] lg:z-[70] lg:h-auto lg:transition-[width] lg:duration-200 lg:ease-out',
                diagramSidebarPreviewRendered ? 'lg:w-[300px]' : 'lg:w-3',
              )
            : 'lg:static lg:z-auto lg:h-auto lg:w-auto',
        )}
      >
        <aside
          className={cn(
            'flex min-h-0 flex-1 flex-col bg-transparent p-2 text-sidebar-foreground',
            'lg:transition-[opacity,translate] lg:duration-200 lg:ease-out',
            chatListCollapsed
              ? cn(
                  'lg:absolute lg:inset-y-0 lg:left-0 lg:w-[300px]',
                  diagramSidebarPreviewOpen
                    ? 'lg:translate-x-0 lg:opacity-100'
                    : 'lg:pointer-events-none lg:-translate-x-full lg:opacity-0',
                )
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
              className={cn(
                'size-8 rounded-lg',
                chatListCollapsed && 'lg:hidden',
              )}
              onClick={() => {
                resetDiagramSidebarPreview()

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

          <nav className="border-b border-sidebar-border/70 px-2.5 pb-3">
          <div className="space-y-1">
            <SharedChatsModal chats={threads} />

            <Button asChild className="w-full justify-start rounded-lg" size="sm">
              <NewChatLink onNavigate={() => setLeftSidebarOpen(false)}>
                <Plus className="h-4 w-4" />
                Nuevo chat
              </NewChatLink>
            </Button>
          </div>
          </nav>

          <nav className="min-h-0 flex-1 overflow-auto px-2 pb-2 pt-3">
          <div>
            {threads.map((item, index) => {
              const isActive = item.chatId === (pendingChatId || activeChatId)
              const startsGroup =
                index === 0 || threads[index - 1]?.groupLabel !== item.groupLabel

              return (
                <div key={item.chatId}>
                  {startsGroup ? (
                    <p
                      className={`mb-1 px-2.5 text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground ${index === 0 ? 'mt-0' : 'mt-3'}`}
                    >
                      {item.groupLabel}
                    </p>
                  ) : null}
                  <Link
                    href={`${PATHS.CHAT}/${item.chatId}`}
                    title={item.title}
                    onNavigate={() => {
                      if (item.chatId !== activeChatId) {
                        setPendingChatId(item.chatId)
                      }
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative mb-1 block rounded-lg border px-3 py-1.5 transition-[background-color,border-color,box-shadow] ${
                      isActive
                        ? 'border-sidebar-border bg-background text-foreground shadow-sm before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-foreground'
                        : 'border-transparent text-sidebar-foreground hover:border-sidebar-border/80 hover:bg-sidebar-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="relative shrink-0" aria-hidden="true">
                        <MessageSquareText
                          className={`size-3.5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                        />
                        {item.isCanvasShared ? (
                          <span className="absolute -bottom-1 -right-1 flex size-2.5 items-center justify-center rounded-full bg-sidebar text-foreground ring-1 ring-sidebar">
                            <Share2 className="size-1.5" strokeWidth={3} />
                          </span>
                        ) : null}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-5 tracking-tight">
                        {item.title}
                      </p>
                      <time
                        dateTime={item.updatedAt}
                        className="shrink-0 text-[10px] leading-5 tabular-nums text-muted-foreground"
                      >
                        {item.updatedAtLabel}
                      </time>
                    </div>
                  </Link>
                </div>
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
      </div>
      </div>

      <main className="relative grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] bg-transparent">
        <header className="relative z-40 min-w-0 bg-transparent px-3 pb-2 pt-3 sm:px-4">
          <div className="toolbar-surface flex min-h-16 min-w-0 items-center justify-between gap-3 rounded-2xl px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
              <Button
                aria-label={
                  chatListCollapsed
                    ? 'Expandir lista de chats'
                    : 'Colapsar lista de chats'
                }
                size="icon"
                type="button"
                variant="ghost"
                className={cn(
                  'shrink-0',
                  chatListCollapsed &&
                    'lg:animate-in lg:fade-in lg:zoom-in-95 lg:duration-200',
                  !chatListCollapsed && 'lg:hidden',
                )}
                onClick={() => {
                  closeDiagram()

                  if (window.matchMedia('(min-width: 1024px)').matches) {
                    setChatListCollapsed(!chatListCollapsed)
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

              <div
                className={cn(
                  'min-w-0 flex-1 pl-3',
                  chatListCollapsed
                    ? 'border-l border-border/70'
                    : 'lg:pl-0',
                )}
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <NewChatLink className="hover:text-foreground">
                    Chats
                  </NewChatLink>
                  <span aria-hidden="true">/</span>
                  <span>Workspace</span>
                </div>
                <h1 className="truncate text-lg font-semibold leading-6 tracking-tight sm:text-xl">
                  {displayedChatTitle}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center rounded-xl border border-border bg-background p-1 sm:flex">
                <Button
                  type="button"
                  size="sm"
                  variant={!diagramOpen ? 'secondary' : 'ghost'}
                  className="rounded-lg shadow-none"
                  aria-pressed={!diagramOpen}
                  onClick={closeDiagram}
                >
                  <MessageSquareText className="size-3.5" />
                  Chat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={diagramOpen ? 'secondary' : 'ghost'}
                  className="rounded-lg shadow-none"
                  aria-pressed={diagramOpen}
                  onClick={openDiagram}
                >
                  <Network className="size-3.5" />
                  Diagrama
                </Button>
              </div>

              <Button
                type="button"
                size="icon"
                variant="outline"
                className="sm:hidden"
                aria-label={diagramOpen ? 'Mostrar chat' : 'Mostrar diagrama'}
                onClick={() => {
                  if (diagramOpen) {
                    closeDiagram()
                  } else {
                    openDiagram()
                  }
                }}
              >
                {diagramOpen ? (
                  <MessageSquareText className="size-4" />
                ) : (
                  <Network className="size-4" />
                )}
              </Button>

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

        <section className="min-h-0 min-w-0 overflow-hidden">
          {hasMounted && isDesktop && diagramRendered ? (
            diagramExpanded ? (
              <div className={cn('h-full p-2', diagramMotionClass)}>
                {diagramPane}
              </div>
            ) : (
              <ResizablePanelGroup
                direction="horizontal"
                autoSaveId="schema-chat-diagram-layout"
                className="min-h-0"
              >
                <ResizablePanel defaultSize={38} minSize={25}>
                  {chatPane}
                </ResizablePanel>
                <ResizableHandle
                  withHandle
                  aria-label="Redimensionar chat y diagrama"
                  className="w-3 after:bg-transparent hover:after:bg-transparent"
                />
                <ResizablePanel defaultSize={62} minSize={35} maxSize={75}>
                  <div
                    className={cn(
                      'h-full py-2 pr-2',
                      diagramMotionClass,
                    )}
                  >
                    {diagramPane}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            )
          ) : diagramRendered ? (
            <div className={cn('h-full p-2', diagramMotionClass)}>
              {diagramPane}
            </div>
          ) : (
            chatPane
          )}
        </section>

      </main>
    </div>
  )
}
