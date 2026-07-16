import { PATHS } from '@/constants/paths'
import { isUserAllowlisted } from '@/lib/access-allowlist'
import { getCurrentUser } from '@/lib/auth'
import { getThreadForUser, getThreadSummariesForUser } from '@/lib/thread'
import { chatIdSchema } from '@/lib/thread-validation'
import { redirect } from 'next/navigation'
import PageContent from './page-content'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

function getThreadGroup(date: Date) {
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
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

  return relativeTime.format(-value, unit).replace(/^hace\s+/, '')
}

export default async function Schema({ params }: PageProps) {
  const { id: rawChatId } = await params
  const chatIdResult = chatIdSchema.safeParse(rawChatId)

  if (!chatIdResult.success) {
    redirect(PATHS.NEW_CHAT)
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  if (!(await isUserAllowlisted(user))) {
    redirect('/#waitlist')
  }

  const chatId = chatIdResult.data
  const [thread, threadSummaries] = await Promise.all([
    getThreadForUser(chatId, user.id),
    getThreadSummariesForUser(user.id),
  ])
  const threads = threadSummaries.map((item) => ({
    chatId: item.chatId,
    title: item.title,
    updatedAt: item.updatedAt.toISOString(),
    updatedAtLabel: getRelativeThreadDate(item.updatedAt),
    groupLabel: getThreadGroup(item.updatedAt),
    isCanvasShared: item.isCanvasShared,
    shareToken: item.shareToken,
  }))
  const clientThread = thread
    ? {
        chatId: thread.chatId,
        diagram: thread.diagram,
        conversation: thread.conversation,
      }
    : null

  return (
    <PageContent
      serverChatId={chatId}
      thread={clientThread}
      threads={threads}
      user={user}
    />
  )
}
