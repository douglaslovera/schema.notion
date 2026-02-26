'use client'

import { LogoutButton } from '@/components/logout-button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { useConfigStore } from '@/stores/config'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronRight, LogIn, MoonStar, Settings, UserCircle2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

type AccountMenuUser = {
  id: string
  email: string
} | null

type AccountMenuProps = {
  user: AccountMenuUser
  signInHref?: string
  className?: string
}

export function AccountMenu({
  user,
  signInHref = '/sign-in',
  className,
}: AccountMenuProps) {
  const { isDarkMode, setDarkMode } = useConfigStore()
  const email = user?.email ?? 'Invitado'
  const initial = (user?.email?.trim()?.[0] || 'G').toUpperCase()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
            className,
          )}
          aria-label="Abrir menú de cuenta"
          title={user ? email : 'Menú de cuenta'}
        >
          {user ? (
            <span aria-hidden="true">{initial}</span>
          ) : (
            <UserCircle2 className="h-4.5 w-4.5" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <div className="rounded-xl px-3 py-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Cuenta
          </p>
          <p className="mt-1 truncate text-sm font-medium tracking-tight">
            {email}
          </p>
        </div>

        <div className="my-1 h-px bg-border/80" />

        <Link
          href="/schemas"
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm opacity-80"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Esquemas
          </span>
        </Link>
        {/* <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-muted-foreground opacity-80"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Cuenta
          </span>
          <ChevronRight className="h-4 w-4" />
        </button> */}

        <div className="flex items-center justify-between rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <MoonStar className="h-4 w-4 text-muted-foreground" />
            <span>Cambiar tema</span>
          </div>
          <Switch
            checked={isDarkMode}
            onCheckedChange={setDarkMode}
            aria-label="Cambiar tema"
          />
        </div>

        <div className="my-1 h-px bg-border/80" />

        {user ? (
          <LogoutButton
            iconOnly={false}
            label="Cerrar sesión"
            className="h-9 w-full justify-start rounded-xl"
          />
        ) : (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start rounded-xl"
          >
            <Link href={signInHref}>
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </Link>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
