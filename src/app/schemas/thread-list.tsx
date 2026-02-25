'use client'

import { Button } from '@/components/ui/button'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { PATHS } from '@/constants/paths'
import type { Thread } from '@/db/schema'
import { deleteThread } from '@/lib/thread'
import { getRelativeTime } from '@/utils/get-relative-time'
import { ArrowUpRight, MessageSquareText, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ThreadWithTitle extends Thread {
  dbTitle: string
}

export function ThreadList({ threads }: { threads: ThreadWithTitle[] }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentThreadToDelete, setCurrentThreadToDelete] =
    useState<ThreadWithTitle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  if (!threads.length) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-[color:var(--surface)]">
            <MessageSquareText className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium tracking-tight">
            No tienes chats todavía
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Crea tu primer workspace para generar un esquema de base de datos y
            empezar a iterar con la IA.
          </p>
          <Button asChild className="mt-5">
            <Link href={PATHS.CHAT}>Iniciar nuevo chat</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDeleteClick = (e: React.MouseEvent, thread: ThreadWithTitle) => {
    e.preventDefault()
    setCurrentThreadToDelete(thread)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (currentThreadToDelete?.chatId) {
      setIsDeleting(true)
      try {
        await deleteThread(currentThreadToDelete.chatId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete thread:', error)
      } finally {
        setIsDeleting(false)
        setShowDeleteModal(false)
        setCurrentThreadToDelete(null)
      }
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="border-b border-border/70 px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground sm:px-5">
          Recientes
        </div>
        <div className="divide-y divide-border/70">
          {threads.map((thread) => (
            <div key={thread.chatId} className="group relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={(e) => handleDeleteClick(e, thread)}
                type="button"
                disabled={isDeleting}
                aria-label={`Eliminar ${thread.dbTitle}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>

              <Link
                href={`${PATHS.CHAT}/${thread.chatId}`}
                className="block px-4 py-4 pr-14 transition-colors hover:bg-accent/50 sm:px-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium tracking-tight sm:text-base">
                        {thread.dbTitle}
                      </p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {getRelativeTime(thread.updatedAt.toISOString())}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {thread.conversation?.at(-1)?.message ||
                        'Sin mensajes todavía'}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <span>
                      {thread.updatedAt.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {currentThreadToDelete ? (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="¿Eliminar este chat?"
          description={`Esta acción no se puede deshacer. Se eliminará permanentemente "${currentThreadToDelete.dbTitle}".`}
          confirmText="Eliminar"
          isLoading={isDeleting}
        />
      ) : null}
    </>
  )
}
