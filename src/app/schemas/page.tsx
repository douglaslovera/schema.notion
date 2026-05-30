import { AccountMenu } from '@/components/account/account-menu'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import type { Thread } from '@/db/schema'
import { isUserAllowlisted } from '@/lib/access-allowlist'
import { getCurrentUser } from '@/lib/auth'
import { getThreadsByUserId } from '@/lib/thread'
import type { Message } from '@/types/chat'
import { Database } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExampleButtons } from './examples'
import { NewChatStarter } from './new-chat-starter'
import { ThreadList } from './thread-list'

export const dynamic = 'force-dynamic'

function getThreadTitle(thread: Thread) {
  const firstUserMessage = (thread.conversation as Message[]).find(
    (message) => message.role === 'user' && message.message.trim(),
  )?.message

  if (!firstUserMessage) {
    return 'Nuevo workspace'
  }

  const normalizedTitle = firstUserMessage.trim()

  return normalizedTitle.length > 72
    ? `${normalizedTitle.slice(0, 72).trimEnd()}…`
    : normalizedTitle
}

export default async function SchemasList() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const isAllowlisted = await isUserAllowlisted(user)

  if (!isAllowlisted) {
    redirect('/#waitlist')
  }

  const threads = await getThreadsByUserId(user.id)
  const threadsWithTitle = threads
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((thread) => ({
      ...thread,
      dbTitle: getThreadTitle(thread),
    }))

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="page-shell flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
              <Database className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium tracking-tight">
                schema.notion
              </p>
              <p className="text-[11px] text-muted-foreground">Tus chats</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggleButton compact />
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      <main className="page-shell grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Esquemas
            </p>
            <h1 className="editorial-title text-3xl tracking-tight sm:text-4xl">
              Continúa tus chats o empieza uno nuevo.
            </h1>
          </div>

          <NewChatStarter />
          <ThreadList threads={threadsWithTitle} />
        </section>

        <aside className="space-y-4">
          <ExampleButtons />
        </aside>
      </main>
    </div>
  )
}
