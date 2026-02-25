import { SchemasNavbar } from '@/components/navigation/schemas-navbar'
import { getCurrentUser } from '@/lib/auth'
import { getThreadsByUserId } from '@/lib/thread'
import { redirect } from 'next/navigation'
import { ExampleButtons } from './examples'
import { NewChatStarter } from './new-chat-starter'
import { ThreadList } from './thread-list'

export default async function SchemasList() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const threads = await getThreadsByUserId(user.id)

  const getDatabaseTitle = (diagram: string) => {
    try {
      const parsed = JSON.parse(diagram)
      return (
        parsed?.workspace?.name ||
        parsed?.workspace?.databases?.[0]?.name ||
        'Untitled Workspace'
      )
    } catch {
      return 'Untitled Workspace'
    }
  }

  const mappedThreads = threads.map((thread) => ({
    ...thread,
    dbTitle: getDatabaseTitle(thread.diagram),
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="page-shell py-4 sm:py-6">
        <div className="mx-auto w-full max-w-4xl">
          <SchemasNavbar user={{ id: user.id, email: user.email }} />
        </div>

        <div className="mx-auto mt-8 w-full max-w-4xl space-y-5">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Workspace
            </p>
            <h1 className="editorial-title mt-3 text-3xl tracking-tight sm:text-5xl">
              Diseña tu siguiente esquema
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Escribe el primer mensaje aquí. Abriremos un chat nuevo y
              enviaremos tu prompt automáticamente para que entres directo al
              canvas.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {user.email.split('@')[0]}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {mappedThreads.length} chat{mappedThreads.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <NewChatStarter />
          <ExampleButtons compact />
          <ThreadList threads={mappedThreads} />
        </div>
      </div>
    </div>
  )
}
