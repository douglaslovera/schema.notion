'use client'

import { authClient } from '@/lib/auth-client'
import { Database, LogIn } from '@/components/ui/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SignInScreen({ redirectPath }: { redirectPath: string }) {
  const router = useRouter()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSigningIn) return

    setIsSigningIn(true)
    setErrorMessage(null)

    try {
      const response = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectPath,
      })

      if (response.error) {
        setErrorMessage('Email o contraseña incorrectos.')
        setIsSigningIn(false)
        return
      }

      if (redirectPath.startsWith('/api/')) {
        // Route handler, not a page: leave the client router.
        window.location.assign(redirectPath)
        return
      }

      router.push(redirectPath)
      router.refresh()
    } catch (error) {
      console.error('Failed to authenticate with email and password', error)
      setErrorMessage('No pudimos iniciar sesión. Inténtalo de nuevo.')
      setIsSigningIn(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return

    setIsSigningIn(true)
    setErrorMessage(null)

    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectPath,
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
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Entra para continuar con tus esquemas.
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Usa tu email y contraseña para abrir un chat nuevo o retomar
            cualquier workspace guardado desde la barra lateral.
          </p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={handleEmailAuth}
          suppressHydrationWarning
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSigningIn}
              required
              suppressHydrationWarning
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSigningIn}
              minLength={8}
              required
              suppressHydrationWarning
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isSigningIn}
          >
            <LogIn className="h-4 w-4" />
            {isSigningIn ? 'Procesando...' : 'Iniciar sesión'}
          </Button>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          o
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
        >
          <LogIn className="h-4 w-4" />
          {isSigningIn ? 'Redirigiendo...' : 'Continuar con Google'}
        </Button>
      </div>
    </div>
  )
}
