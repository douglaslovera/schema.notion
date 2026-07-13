'use client'

import { useChatStore } from '@/stores/chat'
import {
  BriefcaseBusiness,
  CalendarDays,
  FolderKanban,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const STARTER_IDEAS = [
  {
    title: 'Organiza un CRM de ventas',
    description: 'Clientes, contactos, oportunidades y actividades.',
    prompt:
      'Quiero construir un CRM de ventas con clientes, contactos, oportunidades y actividades relacionadas.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Crea un calendario de contenido',
    description: 'Ideas, canales, campañas y publicaciones.',
    prompt:
      'Quiero crear un calendario de contenido para organizar ideas, canales, campañas y publicaciones.',
    icon: CalendarDays,
  },
  {
    title: 'Gestiona proyectos y tareas',
    description: 'Proyectos, tareas, hitos, responsables y fechas.',
    prompt:
      'Quiero gestionar proyectos con tareas, hitos, responsables, fechas y estados de avance.',
    icon: FolderKanban,
  },
] as const

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function ConversationView() {
  const { chatId, chatHistory, handleSendMessage, isLoading } = useChatStore()
  const [areStarterIdeasExiting, setAreStarterIdeasExiting] = useState(false)
  const starterExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  useEffect(() => {
    return () => {
      if (starterExitTimeoutRef.current) {
        clearTimeout(starterExitTimeoutRef.current)
      }
    }
  }, [])

  if (!chatHistory?.length && !isLoading) {
    return (
      <div className="flex h-full min-h-72 items-center justify-center py-6">
        <div className="w-full max-w-3xl">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
              <Sparkles className="size-4 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              ¿Qué quieres construir en Notion?
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Describe tu forma de trabajar o elige una idea para crear la
              estructura inicial de tu workspace.
            </p>
          </div>

          <div className="mt-7 grid gap-2.5 md:grid-cols-3">
            {STARTER_IDEAS.map((idea) => {
              const Icon = idea.icon

              return (
                <button
                  key={idea.title}
                  type="button"
                  disabled={!chatId || areStarterIdeasExiting}
                  onClick={() => {
                    if (!chatId || areStarterIdeasExiting) return

                    setAreStarterIdeasExiting(true)
                    starterExitTimeoutRef.current = setTimeout(() => {
                      void handleSendMessage(idea.prompt, chatId)
                    }, 220)
                  }}
                  className={`group rounded-2xl border border-border/80 bg-card p-4 text-left shadow-[0_1px_0_var(--line-subtle)] transition-[border-color,background-color] hover:border-foreground/20 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-60 ${areStarterIdeasExiting ? 'starter-ideas-exit' : ''}`}
                >
                  <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="mt-4 block text-sm font-medium tracking-tight">
                    {idea.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    {idea.description}
                  </span>
                </button>
              )
            })}
          </div>
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
                  isUser ? 'message-pop-in' : ''
                } ${
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
