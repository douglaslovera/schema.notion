import { LogoutButton } from '@/components/logout-button'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { getCurrentUser } from '@/lib/auth'
import { getThreadsByUserId } from '@/lib/thread'
import { Database, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ExampleButtons } from './examples'
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
        <div className="toolbar-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background">
              <Database className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-tight">
                schema.notion
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                Workspaces guardados
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggleButton compact />
            <LogoutButton iconOnly />
            <Button asChild size="sm" className="rounded-xl">
              <Link href={PATHS.CHAT}>
                <PlusCircle className="h-4 w-4" />
                Nuevo chat
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Tus chats
              </p>
              <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
                Continúa tus esquemas
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Revisa workspaces recientes, retoma conversaciones y sigue
                refinando la estructura de tus bases de datos.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {user.email}
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {mappedThreads.length} chat{mappedThreads.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <ThreadList threads={mappedThreads} />
          </section>

          <aside className="space-y-4">
            <ExampleButtons userId={user.id} />
            <div className="rounded-2xl border border-border/80 bg-card p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Sugerencia
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Empieza con un caso real y luego pide refinamientos por partes:
                relaciones, naming, campos obligatorios, y notas de negocio.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
