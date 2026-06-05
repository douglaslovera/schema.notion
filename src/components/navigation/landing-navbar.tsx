import { AccountMenu } from '@/components/account/account-menu'
import Link from 'next/link'

type LandingNavbarProps = {
  user: { id: string; email: string } | null
}

export function LandingNavbar({ user }: LandingNavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur">
      <div className="page-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-sm font-medium tracking-tight">
          schema.notion
        </Link>

        <AccountMenu user={user} />
      </div>
    </header>
  )
}
