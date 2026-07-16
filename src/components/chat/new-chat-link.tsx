'use client'

import { PATHS } from '@/constants/paths'
import { useChatStore } from '@/stores/chat'
import type { ComponentProps } from 'react'

type NewChatLinkProps = Omit<ComponentProps<'a'>, 'href'> & {
  onNavigate?: () => void
}

export function NewChatLink({
  onNavigate,
  onClick,
  ...props
}: NewChatLinkProps) {
  const startNewChat = useChatStore((state) => state.startNewChat)

  return (
    // href points at the server route so modified clicks (new tab, etc.) still
    // resolve to a fresh chat; a plain left-click is handled entirely on the
    // client to avoid an RSC round trip for a chat that has no server state.
    <a
      href={PATHS.NEW_CHAT}
      onClick={(event) => {
        onClick?.(event)

        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        event.preventDefault()
        onNavigate?.()
        const chatId = startNewChat()
        window.history.pushState(null, '', `${PATHS.CHAT}/${chatId}`)
      }}
      {...props}
    />
  )
}
