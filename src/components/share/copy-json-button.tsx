'use client'

import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { Braces } from 'lucide-react'
import { useState } from 'react'

export function CopyJsonButton({
  schemaJson,
  disabled = false,
}: {
  schemaJson: string | null
  disabled?: boolean
}) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)

  const handleCopy = async () => {
    if (!schemaJson || isCopying) return

    setIsCopying(true)

    try {
      const copied = await copyToClipboard(schemaJson)
      setFeedback(
        copied
          ? 'JSON copiado.'
          : 'No se pudo copiar automáticamente. Inténtalo de nuevo.',
      )
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled={disabled || !schemaJson || isCopying}
        onClick={handleCopy}
      >
        <Braces className="h-4 w-4" />
        Copy JSON
      </Button>

      {feedback ? (
        <p className="max-w-36 text-center text-[11px] leading-4 text-muted-foreground">
          {feedback}
        </p>
      ) : null}
    </div>
  )
}
