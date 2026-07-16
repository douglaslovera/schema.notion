'use client'

import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { useChatStore } from '@/stores/chat'
import { Send } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useRef, useState } from 'react'

export function ChatInput() {
  const { handleSendMessage, isLoading } = useChatStore()
  // Read from the URL, not useParams: a client-side "new chat" updates the
  // pathname via history.pushState, which useParams does not observe.
  const pathname = usePathname()
  const chatId = pathname.startsWith(`${PATHS.CHAT}/`)
    ? pathname.slice(PATHS.CHAT.length + 1)
    : ''
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const maxHeight = 144
    textarea.style.height = '0px'
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${Math.max(nextHeight, 56)}px`
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
      className="w-full"
      suppressHydrationWarning
    >
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-[0_8px_28px_color-mix(in_oklab,var(--foreground)_7%,transparent)] focus-within:border-foreground/25 focus-within:ring-2 focus-within:ring-ring/20">
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
          className="max-h-36 min-h-14 min-w-0 flex-1 basis-80 resize-none border-0 bg-transparent px-2.5 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
          disabled={isLoading}
          required
          spellCheck={false}
          suppressHydrationWarning
        />
        <Button
          type="submit"
          size="default"
          className="ml-auto min-w-24 rounded-xl shadow-sm"
          disabled={isLoading || !message.trim()}
        >
          <Send className="h-3.5 w-3.5" />
          Enviar
        </Button>
      </div>
    </form>
  )
}
