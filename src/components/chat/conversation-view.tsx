'use client'

import { useChatStore } from '@/stores/chat'
import { Sparkles } from 'lucide-react'

export function ConversationView() {
  const { chatHistory, isLoading } = useChatStore()

  if (!chatHistory?.length && !isLoading) {
    return (
      <div className="grid h-full min-h-52 place-items-center">
        <div className="max-w-sm rounded-2xl border border-border/70 bg-[color:var(--surface)] p-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium tracking-tight">
            Empieza la conversación
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Describe tu caso de uso y te propongo una estructura inicial de
            bases de datos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {chatHistory?.map((message) => {
        const isUser = message.role === 'user'

        return (
          <div
            key={message.id}
            className="group relative pb-5"
          >
            <div
              className={`rounded-2xl border p-3 ${
                isUser
                  ? 'border-border/80 bg-[color:var(--surface-strong)] text-foreground'
                  : 'border-border/80 bg-card text-card-foreground'
              }`}
            >
              <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                {message.message}
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-0 right-2 flex h-5 items-center opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-safe:translate-y-0.5">
              <time
                dateTime={new Date(message.timestamp).toISOString()}
                className="text-[10px] tabular-nums text-muted-foreground"
              >
                {new Date(message.timestamp).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          </div>
        )
      })}

      {isLoading ? (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" />
            Procesando respuesta...
          </div>
        </div>
      ) : null}
    </div>
  )
}
