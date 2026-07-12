import { getCurrentUser } from '@/lib/auth'
import { getThread, getThreadsByUserId } from '@/lib/thread'
import type { Message } from '@/types/chat'
import { redirect } from 'next/navigation'
import Poc2ChatLayout from './page-content'

export const dynamic = 'force-dynamic'

type Poc2ChatPageProps = {
  params: Promise<{
    id: string
  }>
}

function getThreadTitle(thread: Awaited<ReturnType<typeof getThread>>) {
  const firstUserMessage = (thread?.conversation as Message[] | undefined)?.find(
    (message) => message.role === 'user' && message.message.trim(),
  )?.message

  if (!firstUserMessage) {
    return 'Nuevo workspace'
  }

  const normalizedTitle = firstUserMessage.trim()

  return normalizedTitle.length > 54
    ? `${normalizedTitle.slice(0, 54).trimEnd()}...`
    : normalizedTitle
}

export default async function Poc2ChatPage({
  params,
}: Poc2ChatPageProps) {
  const { id: chatId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const thread = await getThread(chatId)

  if (!thread || thread.userId !== user.id) {
    redirect('/schemas')
  }

  const threads = await getThreadsByUserId(user.id)
  const threadsWithTitle = threads
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((item) => ({
      chatId: item.chatId,
      title: getThreadTitle(item),
      updatedAt: item.updatedAt.toISOString(),
      updatedAtLabel: item.updatedAt.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'America/Lima',
      }),
    }))

  return (
    <Poc2ChatLayout
      activeChatId={chatId}
      thread={thread}
      threads={threadsWithTitle}
      user={user}
    />
  )
}
