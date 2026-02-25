'use client'

import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { duplicateThread } from '@/lib/thread'
import { CopyPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ExampleButtons({ userId }: { userId: string }) {
  const router = useRouter()
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null)

  const examples = [
    {
      chatId: 'example-online-clothing-store',
      title: 'Tienda de ropa online',
      description: 'Usuarios, catálogo, pedidos, stock y cupones.',
    },
    {
      chatId: 'example-cat-manager',
      title: 'Gestor de gatos',
      description: 'Perfiles, adopciones, vacunas y seguimiento.',
    },
    {
      chatId: 'example-hackathon_project_management',
      title: 'Gestor de proyectos de hackathon',
      description: 'Equipos, tareas, entregables y evaluaciones.',
    },
  ]

  const handleDuplicate = async (chatId: string) => {
    setLoadingChatId(chatId)
    try {
      const response = await duplicateThread(chatId, userId)
      if (response?.chatId) {
        router.push(`${PATHS.CHAT}/${response.chatId}`)
      } else {
        console.error('Error duplicating thread or chatId missing in response')
      }
    } catch (error) {
      console.error('Error in handleDuplicate:', error)
    } finally {
      setLoadingChatId(null)
    }
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
          Duplica una conversación de muestra y edítala en tu propio workspace.
        </p>
      </div>

      <div className="space-y-2">
        {examples.map((example) => (
          <button
            key={example.chatId}
            type="button"
            onClick={() => handleDuplicate(example.chatId)}
            disabled={loadingChatId !== null}
            className="group block w-full rounded-xl border border-border/70 bg-[color:var(--surface)] p-3 text-left transition-colors hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
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
                <CopyPlus className="h-3.5 w-3.5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-3 w-full justify-center"
        disabled={loadingChatId !== null}
        onClick={() =>
          loadingChatId === null &&
          handleDuplicate('example-online-clothing-store')
        }
      >
        {loadingChatId ? 'Cargando ejemplo...' : 'Duplicar ejemplo recomendado'}
      </Button>
    </section>
  )
}
