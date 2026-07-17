import { ChatInput } from '@/components/chat/chat-input'
import { ConversationView } from '@/components/chat/conversation-view'
import { Button } from '@/components/ui/button'
import { ChevronLeft, PanelLeftClose, Sparkles } from '@/components/ui/icons'
import { useChatStore } from '@/stores/chat'
import { useEffect, useRef } from 'react'

export default function Chat({
  hidePanel,
  isMobile = false,
}: {
  hidePanel: () => void
  isMobile?: boolean
}) {
  const { chatHistory, isLoading } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: no need
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isLoading, chatHistory])

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border/90 px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Conversación
            </p>
            <h2 className="truncate text-sm font-medium tracking-tight">
              Asistente de esquema
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={hidePanel}
            aria-label={isMobile ? 'Volver al diagrama' : 'Ocultar chat'}
            className="shrink-0"
          >
            {isMobile ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="rounded-xl border border-sidebar-border bg-[color:var(--surface)] p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-xs leading-5 text-muted-foreground">
              Describe el sistema que quieres modelar y luego pide cambios
              específicos por iteraciones.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="min-h-0 flex-1 overflow-auto px-3 py-3" ref={scrollRef}>
            <ConversationView />
          </div>
          <div className="border-t border-sidebar-border/90 px-3 py-3">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  )
}
