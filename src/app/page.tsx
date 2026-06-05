import { getCurrentUser } from '@/lib/auth'

import { LandingNavbar } from '@/components/navigation/landing-navbar'
import { WaitlistModalButton } from '@/components/waitlist/waitlist-modal-button'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-[100dvh] bg-background">
      <LandingNavbar user={user} />

      <main className="page-shell flex min-h-[calc(100dvh-4rem)] items-center justify-center py-16 text-center">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h1 className="editorial-title text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
            schema.notion
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
            Describe tu proceso en texto simple y conviértelo en bases de datos
            de Notion claras, conectadas y listas para revisar.
          </p>
          <WaitlistModalButton label="Entrar a la Lista de Espera" />
        </section>
      </main>
    </div>
  )
}
