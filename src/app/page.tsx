import { getCurrentUser } from '@/lib/auth'
import { ArrowDown } from 'lucide-react'
import Link from 'next/link'

import { LandingNavbar } from '@/components/navigation/landing-navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WaitlistModalButton } from '@/components/waitlist/waitlist-modal-button'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-[100dvh] bg-background">
      <LandingNavbar user={user} />

      <main>
        <section className="page-shell relative grid min-h-[calc(100dvh-4rem)] gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.48fr)] lg:items-center">
          <div className="max-w-4xl space-y-7">
            <Badge className="w-fit">Beta privada</Badge>
            <div className="space-y-5">
              <h1 className="editorial-title text-4xl leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Diseña bases de datos de Notion sin pelearte con la estructura.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                Describe tu proceso en texto simple. schema.notion lo convierte
                en tablas, propiedades y relaciones que puedes revisar antes de
                implementarlo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <WaitlistModalButton label="Entrar a la Lista de Espera" />
              <Button asChild size="lg" variant="outline">
                <Link href="#como-empezar">Ver cómo funciona</Link>
              </Button>
            </div>
          </div>

          <div className="border-l border-border/80 pl-6 lg:pl-10">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Prompt ejemplo
            </p>
            <p className="mt-4 text-xl leading-8 tracking-tight text-foreground">
              Necesito gestionar leads, oportunidades, tareas y seguimiento por
              etapa para un equipo comercial pequeño.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center text-muted-foreground"
          >
            <ArrowDown className="h-4 w-4" />
          </div>
        </section>

        <section
          id="como-empezar"
          className="border-y border-border/80 bg-[color:var(--surface)]"
        >
          <div className="page-shell grid gap-10 py-14 sm:py-16 lg:grid-cols-[0.72fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Cómo funciona
              </p>
              <h2 className="editorial-title mt-3 text-3xl tracking-tight sm:text-4xl">
                Menos pasos. Menos cajas. Más claridad.
              </h2>
            </div>

            <div className="divide-y divide-border/80 border-y border-border/80">
              {[
                [
                  'Describe el sistema',
                  'Escribe el proceso que quieres modelar sin preparar un documento técnico.',
                ],
                [
                  'Revisa la estructura',
                  'Obtén una primera versión de tablas, propiedades y relaciones.',
                ],
                [
                  'Ajusta lo importante',
                  'Pide cambios concretos hasta que el esquema tenga sentido para tu flujo.',
                ],
              ].map(([title, text], index) => (
                <div
                  key={title}
                  className="grid gap-3 py-5 sm:grid-cols-[4rem_1fr]"
                >
                  <p className="font-mono text-sm text-muted-foreground">
                    0{index + 1}
                  </p>
                  <div>
                    <h3 className="font-medium tracking-tight">{title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="waitlist" className="page-shell py-14 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Waitlist
              </p>
              <h3 className="editorial-title mt-3 max-w-3xl text-3xl tracking-tight sm:text-4xl">
                Estamos preparando el acceso. Súmate a la lista y cerramos el
                siguiente paso.
              </h3>
            </div>
            <WaitlistModalButton label="Entrar a la Lista de Espera" />
          </div>

          <div className="mt-12 grid gap-6 border-t border-border/80 pt-8 md:grid-cols-2">
            {[
              [
                '¿Necesito tener todo definido antes de empezar?',
                'No. Puedes iniciar con una descripción breve y mejorar el esquema en cada iteración.',
              ],
              [
                '¿Puedo retomar un trabajo después?',
                'Sí. Tus conversaciones y esquemas quedan guardados para continuar cuando quieras.',
              ],
            ].map(([question, answer]) => (
              <div key={question}>
                <p className="text-sm font-medium">{question}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="page-shell border-t border-border/80 py-6 text-left text-sm text-muted-foreground">
        Hecho con ☕ por{' '}
        <Link
          href="https://doulovera.com"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Douglas Lovera
        </Link>
      </footer>
    </div>
  )
}
