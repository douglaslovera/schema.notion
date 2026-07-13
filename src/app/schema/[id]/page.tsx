import { isUserAllowlisted } from '@/lib/access-allowlist'
import { PATHS } from '@/constants/paths'
import { getCurrentUser } from '@/lib/auth'
import { getThread, getThreadsByUserId } from '@/lib/thread'
import type { Message } from '@/types/chat'
import { redirect } from 'next/navigation'
import PageContent from './page-content'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

function getThreadGroup(date: Date) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThreadDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  const elapsedDays = Math.floor(
    (startOfToday.getTime() - startOfThreadDay.getTime()) / 86_400_000,
  )

  if (elapsedDays <= 0) return 'Hoy'
  if (elapsedDays === 1) return 'Ayer'
  if (elapsedDays < 7) return 'Esta semana'
  return 'Anteriores'
}

function getRelativeThreadDate(date: Date) {
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  )

  if (elapsedSeconds < 60) return 'ahora'

  const relativeTime = new Intl.RelativeTimeFormat('es', {
    numeric: 'always',
    style: 'narrow',
  })
  const intervals: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  const [unit, secondsPerUnit] =
    intervals.find(([, seconds]) => elapsedSeconds >= seconds) ??
    intervals[intervals.length - 1]
  const value = Math.floor(elapsedSeconds / secondsPerUnit)

  if (unit === 'month') {
    return `${value} ${value === 1 ? 'mes' : 'meses'}`
  }

  return relativeTime
    .format(-value, unit)
    .replace(/^hace\s+/, '')
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

export default async function Schema({ params }: PageProps) {
  const { id: chatId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const isAllowlisted = await isUserAllowlisted(user)

  if (!isAllowlisted) {
    redirect('/#waitlist')
  }

  const thread = await getThread(chatId)

  if (thread && thread.userId !== user.id) {
    redirect(PATHS.NEW_CHAT)
  }

  const threads = await getThreadsByUserId(user.id)
  const threadsWithTitle = threads
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((item) => ({
      chatId: item.chatId,
      title: getThreadTitle(item),
      updatedAt: item.updatedAt.toISOString(),
      updatedAtLabel: getRelativeThreadDate(item.updatedAt),
      groupLabel: getThreadGroup(item.updatedAt),
      isCanvasShared: item.isCanvasShared,
      shareToken: item.shareToken,
    }))

  return (
    <PageContent
      activeChatId={chatId}
      thread={thread}
      threads={threadsWithTitle}
      user={user}
    />
  )
}
