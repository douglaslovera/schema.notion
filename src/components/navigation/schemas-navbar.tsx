import { AccountMenu } from '@/components/account/account-menu'
import { Database } from '@/components/ui/icons'
import Link from 'next/link'

type SchemasNavbarProps = {
  user: { id: string; email: string }
}

export function SchemasNavbar({ user }: SchemasNavbarProps) {
  return (
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
        <AccountMenu user={user} />
      </div>
    </div>
  )
}
