import { getCurrentUser } from '@/lib/auth'

import { LandingNavbar } from '@/components/navigation/landing-navbar'
import { buttonVariants } from '@/components/ui/button'
import { WaitlistModalButton } from '@/components/waitlist/waitlist-modal-button'
import { ArrowRight, Database, MousePointer2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background">
      <LandingNavbar user={user} />

      <main>
        <section className="page-shell relative flex flex-col items-center pb-12 pt-20 text-center sm:pt-28 lg:pt-32">
          <div className="landing-glow" aria-hidden="true" />

          <div className="relative flex max-w-5xl flex-col items-center">

            <h1 className="landing-title max-w-5xl text-[clamp(3.25rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.07em]">
              Diseña tu espacio de Notion{' '}
              <span className="text-muted-foreground">con claridad.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Describe cómo trabajas y convierte tus ideas en bases de datos
              conectadas, listas para revisar y construir en Notion.
            </p>

            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <WaitlistModalButton
                label="Unirme a la lista de espera"
                className="h-12 rounded-full px-6"
              />
              <Link
                href={user ? '/schema/new' : '/sign-in'}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-12 rounded-full px-6',
                )}
              >
                {user ? 'Abrir la app' : 'Ver mis esquemas'}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="preview" className="page-shell pb-20 pt-4 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="h-px w-8 bg-border" />
              TU ESPACIO, ANTES DE CONSTRUIRLO
              <span className="h-px w-8 bg-border" />
            </div>

            <div className="app-preview-shell">
              <div className="flex h-11 items-center justify-between border-b border-border/70 px-4">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-foreground/20" />
                  <span className="size-2.5 rounded-full bg-foreground/12" />
                  <span className="size-2.5 rounded-full bg-foreground/8" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  schema.notion
                </span>
                <span className="w-10" aria-hidden="true" />
              </div>

              <div className="placeholder-grid flex aspect-[16/9] min-h-72 items-center justify-center p-8 sm:aspect-[16/8.5]">
                <div className="flex max-w-sm flex-col items-center text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                    <MousePointer2 className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Vista previa del producto</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    El screenshot de la app irá centrado en este espacio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-border/60 py-16 sm:py-20">
          <div className="page-shell grid gap-8 md:grid-cols-[1fr_1.5fr] md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Cómo funciona
              </p>
              <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                Del proceso que imaginas al esquema que necesitas.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
              {[
                ['01', 'Describe', 'Cuéntanos tu proceso con tus propias palabras.'],
                ['02', 'Conecta', 'Generamos bases, propiedades y relaciones claras.'],
                ['03', 'Refina', 'Revisa el diagrama y ajusta el sistema contigo.'],
              ].map(([step, title, description]) => (
                <article key={step} className="bg-background p-6">
                  <span className="text-xs font-mono text-muted-foreground">{step}</span>
                  <h3 className="mt-10 font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="page-shell flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Database className="size-3.5" /> schema.notion
          </span>
          <span>Diseñado para pensar antes de construir.</span>
        </div>
      </footer>
    </div>
  )
}
