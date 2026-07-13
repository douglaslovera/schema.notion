'use client'

import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { enableCanvasSharing } from '@/lib/thread'
import { Braces, Code2, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ShareAction = 'share' | 'embed'

const ACTION_COPY_LABEL: Record<ShareAction, string> = {
  share: 'Copiar enlace',
  embed: 'Copiar embed',
}

const ACTION_FEEDBACK: Record<ShareAction, string> = {
  share: 'Enlace público copiado.',
  embed: 'Código de embed copiado.',
}

const ACTION_TITLE: Record<ShareAction, string> = {
  share: '¿Compartir canvas?',
  embed: '¿Generar embed del canvas?',
}

const MODAL_DESCRIPTION =
  'Solo se compartirá el canvas, no el chat. Las personas que lo vean no podrán editar el esquema.'

export function ShareCanvasButton({
  chatId,
  schemaJson,
  disabled = false,
}: {
  chatId: string
  schemaJson: string | null
  disabled?: boolean
}) {
  const router = useRouter()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<ShareAction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [manualCopyValue, setManualCopyValue] = useState<string | null>(null)

  const handleOpenConfirmation = (action: ShareAction) => {
    setFeedback(null)
    setManualCopyValue(null)
    setPendingAction(action)
    setIsPopoverOpen(false)
  }

  const handleCopyJson = async () => {
    if (!schemaJson) return

    setFeedback(null)
    setManualCopyValue(null)

    const copied = await copyToClipboard(schemaJson)

    if (copied) {
      setFeedback('JSON copiado.')
      return
    }

    setManualCopyValue(schemaJson)
    setFeedback('No se pudo copiar automáticamente. Copia el texto manualmente.')
  }

  const handleCloseModal = () => {
    if (isSubmitting) return
    setPendingAction(null)
  }

  const handleConfirm = async () => {
    if (!pendingAction) return

    setIsSubmitting(true)

    try {
      const shareToken = await enableCanvasSharing(chatId)
      router.refresh()
      const origin = window.location.origin
      const shareUrl = `${origin}${PATHS.SHARE}/${shareToken}`
      const embedUrl = `${origin}${PATHS.EMBED}/${shareToken}`
      const valueToCopy =
        pendingAction === 'share'
          ? shareUrl
          : `<iframe src="${embedUrl}" style="width:100%;height:640px;border:0;" loading="lazy" title="Canvas compartido"></iframe>`
      setPendingAction(null)
      const copied = await copyToClipboard(valueToCopy)

      if (copied) {
        setManualCopyValue(null)
        setFeedback(ACTION_FEEDBACK[pendingAction])
        return
      }

      setManualCopyValue(valueToCopy)
      setFeedback('No se pudo copiar automáticamente. Copia el texto manualmente.')
      setIsPopoverOpen(true)
    } catch (error) {
      console.error('Failed to share canvas:', error)
      setFeedback('No se pudo copiar. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-[42px] rounded-xl"
            disabled={disabled}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-64 p-2">
          <div className="space-y-1">
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl"
              onClick={() => handleOpenConfirmation('share')}
            >
              <Share2 className="h-4 w-4" />
              Compartir canvas
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl"
              onClick={() => handleOpenConfirmation('embed')}
            >
              <Code2 className="h-4 w-4" />
              Embed
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl"
              onClick={handleCopyJson}
              disabled={!schemaJson}
            >
              <Braces className="h-4 w-4" />
              Copy JSON
            </Button>
          </div>

          {manualCopyValue ? (
            <div className="mt-2 rounded-xl border border-border/80 bg-background px-2 py-2">
              <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Copia manual
              </p>
              <textarea
                readOnly
                value={manualCopyValue}
                onFocus={(event) => event.currentTarget.select()}
                className="min-h-24 w-full resize-none rounded-lg border border-border bg-card p-2 text-xs leading-5 text-foreground outline-none"
              />
            </div>
          ) : null}

          {feedback ? (
            <p className="px-2 pt-2 text-xs leading-5 text-muted-foreground">
              {feedback}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>

      {pendingAction ? (
        <ConfirmationModal
          isOpen
          onClose={handleCloseModal}
          onConfirm={handleConfirm}
          title={ACTION_TITLE[pendingAction]}
          description={MODAL_DESCRIPTION}
          confirmText={ACTION_COPY_LABEL[pendingAction]}
          cancelText="Cancelar"
          isLoading={isSubmitting}
        />
      ) : null}
    </>
  )
}
