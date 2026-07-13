'use client'

import { useChatStore } from '@/stores/chat'
import { Sparkles } from 'lucide-react'

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

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
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-7 py-2">
      {chatHistory?.map((message) => {
        const isUser = message.role === 'user'

        return (
          <div
            key={message.id}
            className={`${isUser ? 'ml-auto max-w-[88%] sm:max-w-[78%]' : 'mr-auto max-w-[92%] sm:max-w-[84%]'}`}
          >
            <div className={`min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
              <div
                className={`mb-1.5 flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <span className="text-[11px] font-medium text-foreground/80">
                  {isUser ? 'Tú' : 'Asistente'}
                </span>
                <time
                  dateTime={new Date(message.timestamp).toISOString()}
                  title={new Date(message.timestamp).toLocaleString('es-ES')}
                  className="text-[10px] tabular-nums text-muted-foreground"
                >
                  {formatMessageTime(message.timestamp)}
                </time>
              </div>

              <div
                className={`rounded-2xl border px-4 py-3 text-left shadow-[0_1px_0_var(--line-subtle)] ${
                  isUser
                    ? 'rounded-tr-md border-foreground/10 bg-[color:var(--surface-strong)]'
                    : 'rounded-tl-md border-border bg-card'
                }`}
              >
                <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                  {message.message}
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {isLoading ? (
        <div className="mr-auto">
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" />
            Procesando respuesta...
          </div>
        </div>
      ) : null}
    </div>
  )
}
