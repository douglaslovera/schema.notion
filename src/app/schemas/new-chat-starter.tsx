'use client'

import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import { Button } from '@/components/ui/button'
import { PENDING_STARTER_MESSAGE_PREFIX } from '@/constants/chat'
import { PATHS } from '@/constants/paths'
import { Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

export function NewChatStarter() {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  const resizeTextarea = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const maxHeight = 168
    textarea.style.height = '0px'
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${Math.max(nextHeight, 52)}px`
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  const startChat = () => {
    const trimmed = message.trim()
    if (!trimmed || isStarting) return

    const chatId = crypto.randomUUID()
    sessionStorage.setItem(
      `${PENDING_STARTER_MESSAGE_PREFIX}${chatId}`,
      trimmed,
    )
    setIsStarting(true)
    router.push(`${PATHS.CHAT}/${chatId}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    if (e.nativeEvent.isComposing) return

    e.preventDefault()
    startChat()
  }

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-4 shadow-[0_1px_0_0_var(--line-subtle)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Nuevo chat
          </p>
        </div>
        <ThemeToggleButton compact className="md:hidden" />
      </div>

      <div className="rounded-2xl border border-border/80 bg-[color:var(--surface)] p-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="starter-message" className="sr-only">
              Primer mensaje del chat
            </label>
            <textarea
              id="starter-message"
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                requestAnimationFrame(resizeTextarea)
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Describe lo que quieres modelar (ej. CRM con cuentas, contactos, oportunidades y actividades)..."
              className="max-h-40 min-h-[52px] w-full resize-none bg-transparent px-1 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              disabled={isStarting}
              spellCheck={false}
            />
          </div>

          <Button
            type="button"
            size="icon"
            className="mt-1 shrink-0 rounded-xl"
            disabled={!message.trim() || isStarting}
            onClick={startChat}
            aria-label="Crear chat y enviar primer mensaje"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
