'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/stores/chat'
import { Send } from 'lucide-react'
import { useParams } from 'next/navigation'

export function ChatInput() {
  const { handleSendMessage, isLoading } = useChatStore()
  const params = useParams()
  const chatId = params.id as string

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const message = String(formData.get('message') || '')

    if (!message.trim() || !chatId) return

    form.reset()
    await handleSendMessage(message, chatId)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="rounded-2xl border border-border/80 bg-background p-2">
        <Input
          name="message"
          placeholder="Describe la base de datos que quieres construir..."
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
          disabled={isLoading}
          required
          autoComplete="off"
        />
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-muted-foreground">
            Sé específico con entidades y relaciones.
          </p>
          <Button
            type="submit"
            size="sm"
            className="rounded-lg"
            disabled={isLoading}
          >
            <Send className="h-3.5 w-3.5" />
            Enviar
          </Button>
        </div>
      </div>
    </form>
  )
}
