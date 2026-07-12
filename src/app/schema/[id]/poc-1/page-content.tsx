'use client'

import { AccountMenu } from '@/components/account/account-menu'
import { ChatInput } from '@/components/chat/chat-input'
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
  MessageSquareText,
  PanelLeftOpen,
  PanelRightOpen,
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

type Poc1ChatLayoutProps = {
  activeChatId: string
  thread: Thread
  threads: SidebarThread[]
  user: User
}

export default function Poc1ChatLayout({
  activeChatId,
  thread,
  threads,
  user,
}: Poc1ChatLayoutProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [expandedSidebar, setExpandedSidebar] = useState<
    'left' | 'right' | null
  >(null)
  const {
    loadChatThread,
    chatId: storeChatId,
    chatHistory,
    chatDiagram,
    isLoading,
    handleSendMessage,
  } = useChatStore()
  const processedStarterForChatIdRef = useRef<string | null>(null)
  const historyScrollRef = useRef<HTMLDivElement>(null)
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
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight
    }
  })

  return (
    <div className="grid h-[100dvh] overflow-hidden bg-background text-foreground lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside
        className={cn(
          'min-h-0 border-r border-border/70 bg-sidebar text-sidebar-foreground',
          expandedSidebar === 'left'
            ? 'fixed inset-0 z-[70] flex h-[100dvh] w-screen flex-col'
            : 'hidden',
          'lg:static lg:z-auto lg:flex lg:h-auto lg:w-auto lg:flex-col',
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

          <div className="flex items-center gap-1 lg:hidden">
            <Button
              aria-label="Abrir historial"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setExpandedSidebar('right')}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Cerrar chats"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setExpandedSidebar(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-b border-sidebar-border/90 p-3">
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
              const isActive = item.chatId === activeChatId

              return (
                <Link
                  key={item.chatId}
                  href={`${PATHS.CHAT}/${item.chatId}/poc-1`}
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

      <main className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="relative z-50 border-b border-border/70 bg-background/90 px-3 py-3 backdrop-blur sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link href={PATHS.SCHEMAS} className="hover:text-foreground">
                  Chats
                </Link>
                <span>/</span>
                <span>POC 1</span>
              </div>
              <h1 className="truncate text-sm font-medium tracking-tight sm:text-base">
                {workspaceTitle}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1 lg:hidden">
                <Button
                  aria-label="Abrir chats"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setExpandedSidebar((current) =>
                      current === 'left' ? null : 'left',
                    )
                  }
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
                <Button
                  aria-label="Abrir historial"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setExpandedSidebar((current) =>
                      current === 'right' ? null : 'right',
                    )
                  }
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </div>
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

        <section className="relative z-0 min-h-0 overflow-hidden subtle-canvas">
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
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Canvas
                </p>
                <p className="mt-2 text-base font-medium tracking-tight">
                  Aún no hay diagrama
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Escribe un prompt abajo para generar el esquema en este lienzo.
                </p>
              </div>
            </div>
          ) : null}

          <ReactFlowProvider>
            <Diagram />
          </ReactFlowProvider>
        </section>

        <footer className="border-t border-border/70 bg-background px-3 py-3 sm:px-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput />
          </div>
        </footer>
      </main>

      <aside
        className={cn(
          'min-h-0 border-l border-border/70 bg-[color:var(--surface)]',
          expandedSidebar === 'right'
            ? 'fixed inset-0 z-[70] grid h-[100dvh] w-screen grid-rows-[auto_minmax(0,1fr)]'
            : 'hidden',
          'lg:static lg:z-auto lg:grid lg:h-auto lg:w-auto lg:grid-rows-[auto_minmax(0,1fr)]',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Chat history
            </p>
            <h2 className="truncate text-sm font-medium tracking-tight">
              Conversación de prueba
            </h2>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <Button
              aria-label="Abrir chats"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setExpandedSidebar('left')}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Cerrar historial"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => setExpandedSidebar(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={historyScrollRef} className="min-h-0 overflow-auto p-3">
          {!chatHistory?.length && !isLoading ? (
            <div className="grid h-full min-h-52 place-items-center text-center">
              <div>
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                  <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium tracking-tight">
                  Sin mensajes todavía
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {chatHistory?.map((message) => {
                const isUser = message.role === 'user'

                return (
                  <div
                    key={message.id}
                    className={`rounded-xl border p-3 ${
                      isUser
                        ? 'border-border/80 bg-background'
                        : 'border-border/70 bg-card'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {isUser ? 'Tú' : 'IA'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString(
                          'es-ES',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </span>
                    </div>
                    {isUser ? (
                      <p className="whitespace-pre-line text-sm leading-6">
                        {message.message}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-2xl leading-none">
                        <span aria-label="Pulgar arriba" role="img">
                          👍
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {isLoading ? (
                <div className="rounded-xl border border-border/70 bg-card p-3">
                  <div className="flex items-center gap-2 text-2xl leading-none">
                    <span aria-label="Pulgar arriba" role="img">
                      👍
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
