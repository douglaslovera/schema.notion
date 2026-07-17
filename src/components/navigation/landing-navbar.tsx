import { AccountMenu } from '@/components/account/account-menu'
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import { buttonVariants } from '@/components/ui/button'
import { Database } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type LandingNavbarProps = {
  user: { id: string; email: string } | null
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Database className="size-4" strokeWidth={2.25} />
            </span>
            schema.notion
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              Cómo funciona
            </a>
            <a href="#preview" className="transition-colors hover:text-foreground">
              Producto
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggleButton compact className="rounded-full" />
          <Link
            href={user ? '/schema/new' : '/sign-in'}
            className={cn(
              buttonVariants({ size: 'sm' }),
              'hidden rounded-full px-4 sm:inline-flex',
            )}
          >
            {user ? 'Abrir la app' : 'Iniciar sesión'}
          </Link>
          <AccountMenu user={user} className="sm:hidden" />
        </div>
      </div>
    </header>
  )
}
