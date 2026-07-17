'use client'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  ExternalLink,
  LoaderCircle,
  Share2,
  Unlink2,
} from '@/components/ui/icons'
import { PATHS } from '@/constants/paths'
import { disableCanvasSharing } from '@/lib/thread-actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type SharedChat = {
  chatId: string
  title: string
  updatedAt: string
  updatedAtLabel: string
  isCanvasShared: boolean
  shareToken: string | null
}

export function SharedChatsModal({ chats }: { chats: SharedChat[] }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [unpublishingChatId, setUnpublishingChatId] = useState<string | null>(
    null,
  )
  const [unpublishedChatIds, setUnpublishedChatIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [error, setError] = useState<string | null>(null)
  const sharedChats = chats.filter(
    (chat) =>
      chat.isCanvasShared &&
      chat.shareToken &&
      !unpublishedChatIds.has(chat.chatId),
  )

  useEffect(() => {
    setUnpublishedChatIds((current) => {
      const unpublishedChatsFromServer = new Set(
        chats
          .filter((chat) => !chat.isCanvasShared)
          .map((chat) => chat.chatId),
      )
      const next = new Set(
        [...current].filter(
          (chatId) => !unpublishedChatsFromServer.has(chatId),
        ),
      )

      return next.size === current.size ? current : next
    })
  }, [chats])

  const handleUnpublish = async (chatId: string) => {
    setError(null)
    setUnpublishingChatId(chatId)

    try {
      await disableCanvasSharing(chatId)
      setUnpublishedChatIds((current) => new Set(current).add(chatId))
      router.refresh()
    } catch (unpublishError) {
      console.error('Failed to unpublish canvas:', unpublishError)
      setError('No se pudo dejar de compartir. Inténtalo de nuevo.')
    } finally {
      setUnpublishingChatId(null)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-full justify-start gap-3 rounded-lg px-3 font-normal text-muted-foreground hover:border-transparent hover:bg-sidebar-accent hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="size-4" />
        Chats compartidos
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-h-[min(640px,calc(100dvh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] rounded-2xl border-border/80 p-0 sm:max-w-xl">
          <AlertDialogHeader className="border-b border-border/70 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                <Share2 className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <AlertDialogTitle className="text-base tracking-tight">
                  Chats compartidos
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-0.5 leading-5">
                  Canvas que tienen un enlace público activo.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="min-h-0 overflow-y-auto px-3 py-3 sm:px-4">
            {sharedChats.length ? (
              <div className="space-y-1.5">
                {sharedChats.map((chat) => (
                  <div
                    key={chat.chatId}
                    className="group flex items-center gap-1 rounded-xl border border-transparent p-1 transition-colors hover:border-border hover:bg-accent/60"
                  >
                    <Link
                      href={`${PATHS.SHARE}/${chat.shareToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground group-hover:text-foreground">
                        <Share2 className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium tracking-tight">
                          {chat.title}
                        </span>
                        <time
                          dateTime={chat.updatedAt}
                          className="mt-0.5 block text-xs text-muted-foreground"
                        >
                          Actualizado {chat.updatedAtLabel}
                        </time>
                      </span>
                      <ExternalLink
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Abrir enlace público</span>
                    </Link>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-lg text-muted-foreground hover:text-foreground"
                      disabled={unpublishingChatId !== null}
                      aria-label={`Dejar de compartir ${chat.title}`}
                      title="Dejar de compartir"
                      onClick={() => void handleUnpublish(chat.chatId)}
                    >
                      {unpublishingChatId === chat.chatId ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink2 className="size-4" />
                          <span className="hidden sm:inline">Despublicar</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))}

                {error ? (
                  <p
                    role="alert"
                    className="px-3 pt-2 text-xs leading-5 text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                  <Share2 className="size-4" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-medium tracking-tight">
                  Aún no tienes chats compartidos
                </p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                  Comparte un canvas desde un chat y aparecerá aquí para que
                  puedas abrir su enlace público.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter className="border-t border-border/70 px-5 py-4 sm:px-6">
            <AlertDialogCancel className="rounded-lg">Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
