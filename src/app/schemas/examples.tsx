'use client'

import {
  PENDING_STARTER_MESSAGE_PREFIX,
  SCHEMAS_TEMPLATES_DISMISSED_STORAGE_KEY,
} from '@/constants/chat'
import { PATHS } from '@/constants/paths'
import { Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ExampleButtons({
  compact = false,
}: {
  compact?: boolean
}) {
  const router = useRouter()
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [dismissHydrated, setDismissHydrated] = useState(false)

  const examples = [
    {
      id: 'template-online-clothing-store',
      title: 'Tienda de ropa online',
      description: 'Usuarios, catálogo, pedidos, stock y cupones.',
      prompt:
        'Quiero un esquema de Notion para una tienda de ropa online. Incluye bases de datos para usuarios, productos, variantes (talla/color), inventario por variante, pedidos, items de pedido, pagos, envíos, cupones y reseñas. Agrega relaciones clave y propiedades útiles para operar el negocio.',
    },
    {
      id: 'template-cat-manager',
      title: 'Gestor de gatos',
      description: 'Perfiles, adopciones, vacunas y seguimiento.',
      prompt:
        'Diseña un esquema de Notion para un gestor de gatos y adopciones. Necesito bases de datos para gatos, refugios, adoptantes, solicitudes de adopción, vacunas, controles veterinarios, tratamientos y seguimientos. Incluye relaciones y campos importantes.',
    },
    {
      id: 'template-hackathon-project-management',
      title: 'Gestor de proyectos de hackathon',
      description: 'Equipos, tareas, entregables y evaluaciones.',
      prompt:
        'Genera un esquema de Notion para gestión de proyectos de hackathon con bases de datos para hackathons, equipos, participantes, proyectos, tareas, mentores, entregables, criterios de evaluación y puntuaciones. Incluye relaciones entre equipos, proyectos y evaluaciones.',
    },
  ]

  const startChatFromTemplate = (templateId: string, prompt: string) => {
    if (loadingTemplate) return

    const chatId = crypto.randomUUID()
    sessionStorage.setItem(
      `${PENDING_STARTER_MESSAGE_PREFIX}${chatId}`,
      prompt,
    )
    setLoadingTemplate(templateId)
    router.push(`${PATHS.CHAT}/${chatId}`)
  }

  useEffect(() => {
    if (!compact) return

    try {
      const storedValue = localStorage.getItem(
        SCHEMAS_TEMPLATES_DISMISSED_STORAGE_KEY,
      )
      setIsDismissed(storedValue === 'true')
    } catch {
      setIsDismissed(false)
    } finally {
      setDismissHydrated(true)
    }
  }, [compact])

  const handleDismissCompactTemplates = () => {
    if (loadingTemplate) return

    try {
      localStorage.setItem(SCHEMAS_TEMPLATES_DISMISSED_STORAGE_KEY, 'true')
    } catch {
      // Ignore storage errors and still hide for current render.
    }
    setIsDismissed(true)
  }

  if (compact) {
    if (!dismissHydrated) {
      return null
    }

    if (isDismissed) {
      return null
    }

    return (
      <section className="rounded-2xl border border-border/80 bg-card p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Plantillas rápidas
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ejemplos para probar el flujo automáticamente.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismissCompactTemplates}
            disabled={loadingTemplate !== null}
            aria-label="Ocultar plantillas"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {examples.map((example) => (
            <button
              key={example.id}
              type="button"
              onClick={() => startChatFromTemplate(example.id, example.prompt)}
              disabled={loadingTemplate !== null}
              className="group block cursor-pointer rounded-2xl border border-border/80 bg-card p-3 text-left transition-colors hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="mb-2 inline-flex rounded-lg border border-border bg-[color:var(--surface)] p-1.5 text-muted-foreground">
                <Send className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-medium tracking-tight">
                {example.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {loadingTemplate === example.id
                  ? 'Abriendo chat y enviando prompt...'
                  : example.description}
              </p>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Plantillas
        </p>
        <h2 className="mt-2 text-base font-medium tracking-tight">
          Empezar desde un ejemplo
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Abre un chat nuevo y envía automáticamente un prompt de ejemplo para
          ver el flujo en acción.
        </p>
      </div>

      <div className="space-y-2">
        {examples.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => startChatFromTemplate(example.id, example.prompt)}
            disabled={loadingTemplate !== null}
            className="group block w-full cursor-pointer rounded-xl border border-border/70 bg-[color:var(--surface)] p-3 text-left transition-colors hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium tracking-tight">
                  {example.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {example.description}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
                <Send className="h-3.5 w-3.5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
