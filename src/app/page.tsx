import { getCurrentUser } from '@/lib/auth'
import {
  ArrowRight,
  GitBranch,
  MessageSquareText,
  Sparkles,
  TableProperties,
} from 'lucide-react'
import Link from 'next/link'

import { LandingNavbar } from '@/components/navigation/landing-navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PATHS } from '@/constants/paths'

function PlaceholderFrame({
  label,
  subtitle,
  className = '',
}: {
  label: string
  subtitle?: string
  className?: string
}) {
  return (
    <div
      className={`placeholder-frame placeholder-grid flex min-h-48 flex-col justify-between p-5 ${className}`}
    >
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em]">
        <span>{label}</span>
        <span>Placeholder</span>
      </div>
      <div className="grid gap-2">
        <div className="h-2.5 w-2/3 rounded-full bg-foreground/10" />
        <div className="h-2.5 w-full rounded-full bg-foreground/8" />
        <div className="h-2.5 w-4/5 rounded-full bg-foreground/8" />
      </div>
      {subtitle ? <p className="text-xs">{subtitle}</p> : null}
    </div>
  )
}

export default async function LandingPage() {
  const user = await getCurrentUser()

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar user={user} />

      <main className="page-shell py-8 sm:py-12">
        <section className="grid gap-8 rounded-3xl border border-border/80 bg-card p-5 shadow-[0_1px_0_0_var(--line-subtle)] sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="space-y-6">
            <Badge className="w-fit">Beta privada</Badge>
            <div className="space-y-4">
              <h1 className="editorial-title text-4xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Diseña tus Bases de Datos para Notion sin empezar desde cero.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Describe tu sistema en lenguaje natural, conversa con la IA y
                obtén una vista visual de bases de datos y relaciones. Pensado
                para iterar rápido, no para pelearte con diagramas vacíos.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={PATHS.CHAT}>
                  Crear un esquema
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#producto">Ver interfaz</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Chat guiado', 'Iteraciones con contexto'],
                ['Diagrama visual', 'Relaciones y propiedades'],
                ['Historial', 'Retoma chats anteriores'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-xl border border-border/70 bg-[color:var(--surface)] px-4 py-3"
                >
                  <p className="text-sm font-medium tracking-tight">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="paper-surface overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-foreground/20" />
                <span className="h-2 w-2 rounded-full bg-foreground/12" />
                <span className="h-2 w-2 rounded-full bg-foreground/8" />
                <span className="ml-2">Vista del producto</span>
              </div>
              <PlaceholderFrame
                label="Screenshot principal"
                subtitle="Reemplaza este bloque con la captura de pantalla del canvas + chat."
                className="min-h-[360px] rounded-none border-0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <PlaceholderFrame
                label="Vista de chat"
                subtitle="Sidebar conversacional"
                className="min-h-36"
              />
              <PlaceholderFrame
                label="Vista del diagrama"
                subtitle="Canvas y relaciones"
                className="min-h-36"
              />
            </div>
          </div>
        </section>

        <section id="producto" className="mt-16 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Producto
              </p>
              <h2 className="editorial-title mt-2 text-3xl tracking-tight sm:text-4xl">
                Un flujo simple: pedir, revisar, ajustar.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Reorganizamos la experiencia para que el esquema y la conversación
              convivan como un workspace, con controles mínimos y foco en el
              contenido.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-[color:var(--surface)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareText className="h-4 w-4" />
                  Conversación estructurada
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-6 text-muted-foreground">
                  El chat se comporta como una barra lateral de trabajo: ves el
                  historial, iteras y mantienes contexto.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[color:var(--surface)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TableProperties className="h-4 w-4" />
                  Bases de datos visuales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-6 text-muted-foreground">
                  Cada tabla se presenta como bloque legible, con propiedades y
                  relaciones resaltadas por color.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-[color:var(--surface)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitBranch className="h-4 w-4" />
                  Iteración incremental
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-6 text-muted-foreground">
                  Pide cambios puntuales y conserva el hilo de la conversación
                  sin reconstruir el esquema desde cero.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="flujo" className="mt-16 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Flujo de trabajo
            </p>
            <h3 className="editorial-title mt-3 text-2xl tracking-tight sm:text-3xl">
              De idea a esquema en tres pasos.
            </h3>
            <div className="mt-6 space-y-4">
              {[
                ['1', 'Describe lo que necesitas', 'Ejemplo: e-commerce con usuarios, pedidos, inventario y cupones.'],
                ['2', 'Revisa el diagrama generado', 'Valida tablas, propiedades y relaciones directamente en el canvas.'],
                ['3', 'Refina por conversación', 'Pide cambios incrementales: índices, nuevas entidades o ajustes de nombres.'],
              ].map(([step, title, body]) => (
                <div key={step} className="flex gap-3 rounded-xl border border-border/70 bg-[color:var(--surface)] p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlaceholderFrame
              label="Paso 1"
              subtitle="Captura del prompt inicial en el chat"
              className="min-h-56"
            />
            <PlaceholderFrame
              label="Paso 2"
              subtitle="Captura del diagrama generado"
              className="min-h-56"
            />
            <PlaceholderFrame
              label="Paso 3"
              subtitle="Captura de refinamiento por chat"
              className="min-h-56 sm:col-span-2"
            />
          </div>
        </section>

        <section id="faq" className="mt-16 rounded-3xl border border-border/80 bg-card p-5 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                FAQ rápida
              </p>
              <h3 className="editorial-title mt-2 text-2xl tracking-tight sm:text-3xl">
                Hecho para explorar ideas, no solo para dibujar tablas.
              </h3>
            </div>
            <Button asChild>
              <Link href={PATHS.CHAT}>
                Empezar ahora
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              [
                '¿Puedo volver a un chat anterior?',
                'Sí. Cada conversación se guarda como un workspace y puedes retomarla desde la vista de esquemas.',
              ],
              [
                '¿Necesito tener el diseño claro desde el inicio?',
                'No. La experiencia está pensada para iterar: describe una versión inicial y luego ajusta por conversación.',
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
