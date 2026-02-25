import { LogoutButton } from '@/components/logout-button'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import { Diagram } from '@/components/reactflow/diagram'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { parseNotionSchemaGraph } from '@/lib/parse-utils'
import { useChatStore } from '@/stores/chat'
import { ReactFlowProvider } from '@xyflow/react'
import { ChevronLeft, ChevronRight, PanelLeftOpen } from 'lucide-react'
import Link from 'next/link'

export default function DiagramPanel({
  chatPanelIsShown,
  toggleChatPanel,
  isMobile = false,
}: {
  chatPanelIsShown: boolean
  toggleChatPanel: (show: boolean) => void
  isMobile?: boolean
}) {
  const { isLoading, chatDiagram } = useChatStore()
  const parsedGraph = parseNotionSchemaGraph(chatDiagram || '')
  const workspaceTitle =
    parsedGraph.workspaceName && parsedGraph.workspaceName !== 'Workspace'
      ? parsedGraph.workspaceName
      : 'Nuevo workspace'

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border/70 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleChatPanel(true)}
                aria-label="Abrir chat"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : null}

          {!chatPanelIsShown && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleChatPanel(true)}
              aria-label="Mostrar chat"
              className="rounded-xl"
            >
              <PanelLeftOpen className="mr-2 h-4 w-4" />
              Mostrar chat
            </Button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href={PATHS.SCHEMAS} className="hover:text-foreground">
                Chats
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate">Workspace</span>
            </div>
            <h2 className="truncate text-sm font-medium tracking-tight sm:text-base">
              {workspaceTitle}
            </h2>
          </div>
        </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton compact />
            <LogoutButton iconOnly />
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden subtle-canvas">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/55 backdrop-blur-[2px]">
            <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              Generando esquema...
            </div>
          </div>
        )}

        {!chatDiagram && !isLoading ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center p-4">
            <div className="max-w-md rounded-2xl border border-border/80 bg-card/90 p-5 text-center shadow-[0_1px_0_0_var(--line-subtle)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Canvas
              </p>
              <p className="mt-2 text-base font-medium tracking-tight">
                Aún no hay diagrama
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Abre el chat y describe la base de datos que quieres construir.
                El diagrama aparecerá aquí automáticamente.
              </p>
            </div>
          </div>
        ) : null}

        <ReactFlowProvider>
          <Diagram />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
