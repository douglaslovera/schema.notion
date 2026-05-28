'use client'

import { authClient } from '@/lib/auth-client'
import { Database, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export function SignInScreen() {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return

    setIsSigningIn(true)
    setErrorMessage(null)

    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/schemas',
      })
    } catch (error) {
      console.error('Failed to start Google sign-in', error)
      setErrorMessage('No pudimos iniciar sesión. Inténtalo de nuevo.')
      setIsSigningIn(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-[0_1px_0_0_var(--line-subtle)] sm:p-7">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
            <Database className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium tracking-tight">schema.notion</p>
            <p className="text-[11px] text-muted-foreground">
              Accede para ver tus chats
            </p>
          </div>
        </Link>

        <div className="mt-8 space-y-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Iniciar sesión
          </p>
          <h1 className="editorial-title text-3xl tracking-tight">
            Entra para continuar con tus esquemas.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Usa tu cuenta de Google para abrir /schemas y retomar cualquier
            workspace guardado.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            type="button"
            className="h-11 w-full"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
          >
            <LogIn className="h-4 w-4" />
            {isSigningIn ? 'Redirigiendo...' : 'Continuar con Google'}
          </Button>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
