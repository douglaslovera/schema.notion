'use client'

import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat'
import { Send } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useRef, useState } from 'react'

export function ChatInput() {
  const { handleSendMessage, isLoading } = useChatStore()
  const params = useParams()
  const chatId = params.id as string
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const maxHeight = 144
    textarea.style.height = '0px'
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${Math.max(nextHeight, 44)}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!message.trim() || !chatId) return

    const messageToSend = message
    setMessage('')
    requestAnimationFrame(resizeTextarea)
    await handleSendMessage(messageToSend, chatId)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (e.nativeEvent.isComposing) return

    e.preventDefault()
    e.currentTarget.form?.requestSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2"
      suppressHydrationWarning
    >
      <div className="rounded-2xl border border-border/80 bg-background p-2">
        <textarea
          ref={textareaRef}
          name="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            requestAnimationFrame(resizeTextarea)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe la base de datos que quieres construir..."
          rows={1}
          className="max-h-36 min-h-11 w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          disabled={isLoading}
          required
          spellCheck={false}
          suppressHydrationWarning
        />
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border px-1 font-mono text-[10px]">Enter</kbd> envía, <kbd className="rounded border border-border px-1 font-mono text-[10px]">Shift + Enter</kbd> agrega línea.
          </p>
          <Button
            type="submit"
            size="sm"
            className="rounded-lg"
            disabled={isLoading || !message.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            Enviar
          </Button>
        </div>
      </div>
    </form>
  )
}
