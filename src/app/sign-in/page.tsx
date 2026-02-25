'use client'

import { ThemeToggleButton } from '@/components/theme/theme-toggle-button'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { ArrowRight, Database, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function SignInPage() {
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/schemas',
      })
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError('No se pudo iniciar sesión con Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-shell py-4">
        <div className="flex justify-end">
          <ThemeToggleButton compact />
        </div>
      </div>

      <div className="page-shell pb-10 pt-2 sm:pb-16">
        <div className="grid overflow-hidden rounded-3xl border border-border/80 bg-card shadow-[0_1px_0_0_var(--line-subtle)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-border/70 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium">schema.ai</p>
                <p className="text-xs text-muted-foreground">
                  Workspace de esquemas Notion
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Acceso
              </p>
              <h1 className="editorial-title text-3xl tracking-tight sm:text-4xl">
                Continúa donde dejaste tu diseño.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-muted-foreground">
                Entra con Google para abrir tus chats guardados, seguir iterando
                esquemas y revisar diagramas anteriores.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="placeholder-frame placeholder-grid min-h-[220px] rounded-2xl p-4">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Vista de bienvenida</span>
                  <span>Placeholder</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-2">
                    <div className="h-2.5 w-2/3 rounded-full bg-foreground/10" />
                    <div className="h-2.5 w-full rounded-full bg-foreground/8" />
                    <div className="h-2.5 w-5/6 rounded-full bg-foreground/8" />
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/80 p-3">
                  <p className="text-xs font-medium">Reemplaza este bloque</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Aquí puedes colocar una captura o arte de branding del
                    producto.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Historial persistente', 'Retoma cualquier chat'],
                  ['Canvas visual', 'Relaciones y propiedades'],
                ].map(([title, caption]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-border/70 bg-[color:var(--surface)] p-3"
                  >
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {caption}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center p-6 sm:p-8">
            <div className="mx-auto w-full max-w-sm space-y-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Iniciar sesión
                </p>
                <h2 className="text-2xl font-medium tracking-tight">
                  Entrar con Google
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Usamos Google para identificar tu cuenta y asociar tus
                  workspaces.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="h-11 w-full justify-between rounded-xl"
              >
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-semibold">
                    G
                  </span>
                  {isLoading ? 'Redirigiendo a Google...' : 'Continuar con Google'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="rounded-xl border border-border/70 bg-[color:var(--surface)] p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">
                  Nota
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Después del acceso, entrarás a <code>/schemas</code> para ver
                  tus chats o crear uno nuevo.
                </p>
              </div>

              <Button asChild variant="ghost" className="w-full justify-center">
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
