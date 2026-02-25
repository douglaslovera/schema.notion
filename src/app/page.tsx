import { getCurrentUser } from '@/lib/auth'
import { ArrowRight, CheckCircle2, Sparkles, Timer } from 'lucide-react'
import Link from 'next/link'

import { LandingNavbar } from '@/components/navigation/landing-navbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PATHS } from '@/constants/paths'

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar user={user} />

      <main className="page-shell py-8 sm:py-12">
        <section className="grid gap-6 rounded-3xl border border-border/80 bg-card p-6 shadow-[0_1px_0_0_var(--line-subtle)] sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <Badge className="w-fit">Beta privada</Badge>
            <h1 className="editorial-title text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Crea tu esquema de Notion sin complicarte.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Escribe lo que necesitas en texto simple y schema.notion te ayuda a
              convertirlo en tablas y relaciones claras. Todo en un flujo guiado,
              desde el primer prompt.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={PATHS.SCHEMAS}>
                  Empezar ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#como-empezar">Cómo empezar</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-[color:var(--surface)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4" />
                Empieza en 1 minuto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {[
                'Abre un chat nuevo.',
                'Escribe tu necesidad (ej: CRM con clientes, deals y tareas).',
                'Itera el diagrama con instrucciones cortas.',
              ].map((item) => (
                <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <span>{item}</span>
                </div>
              ))}

              <div className="rounded-xl border border-border/70 bg-background p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Prompt sugerido
                </p>
                <p className="mt-2 text-sm">
                  “Necesito un sistema para gestionar leads, oportunidades y
                  seguimiento comercial por etapa.”
                </p>
              </div>

              <Button asChild className="w-full">
                <Link href={PATHS.SCHEMAS}>
                  Ir al chat
                  <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section id="como-empezar" className="mt-16 space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Cómo empezar
            </p>
            <h2 className="editorial-title mt-2 text-3xl tracking-tight sm:text-4xl">
              Un flujo simple y claro desde la primera pantalla.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                'Define el objetivo',
                'Describe el proceso que quieres modelar. No hace falta detalle técnico.',
              ],
              [
                'Genera el primer borrador',
                'Obtén tablas y relaciones iniciales para revisar rápidamente.',
              ],
              [
                'Refina hasta cerrar',
                'Pide cambios concretos y deja el esquema listo para implementar.',
              ],
            ].map(([title, text], index) => (
              <Card key={title} className="bg-[color:var(--surface)]">
                <CardHeader>
                  <p className="text-xs text-muted-foreground">Paso {index + 1}</p>
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-6 text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="mt-16 rounded-3xl border border-border/80 bg-card p-5 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                FAQ rápida
              </p>
              <h3 className="editorial-title mt-2 text-2xl tracking-tight sm:text-3xl">
                Lo necesario para arrancar sin fricción.
              </h3>
            </div>
          </div>

          <div className="mt-8 flex justify-start">
            <Button asChild>
              <Link href={PATHS.SCHEMAS}>
                Empezar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
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
              <div key={question} className="rounded-xl border border-border/70 bg-[color:var(--surface)] p-4">
                <p className="text-sm font-medium">{question}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
