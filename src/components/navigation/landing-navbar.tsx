import { AccountMenu } from '@/components/account/account-menu'
import { Button } from '@/components/ui/button'
import { PATHS } from '@/constants/paths'
import { Database } from 'lucide-react'
import Link from 'next/link'

type LandingNavbarProps = {
  user: { id: string; email: string } | null
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  const primaryHref = user ? PATHS.SCHEMAS : '/sign-in'
  const primaryLabel = user ? 'Abrir workspace' : 'Iniciar sesión'

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
            <Database className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium tracking-tight">schema.notion</p>
            <p className="text-[11px] text-muted-foreground">
              Notion schema studio
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="#producto">Producto</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="#flujo">Flujo</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="#faq">FAQ</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <AccountMenu user={user} />
          <Button asChild size="sm">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
