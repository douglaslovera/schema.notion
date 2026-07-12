'use client'

import { authClient } from '@/lib/auth-client'
import { Database, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type AuthMode = 'sign-in' | 'sign-up'

export function SignInScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isSignUp = mode === 'sign-up'

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSigningIn) return

    setIsSigningIn(true)
    setErrorMessage(null)

    try {
      const response = isSignUp
        ? await authClient.signUp.email({
            name: name.trim() || email.split('@')[0],
            email,
            password,
            callbackURL: '/schemas',
          })
        : await authClient.signIn.email({
            email,
            password,
            callbackURL: '/schemas',
          })

      if (response.error) {
        setErrorMessage(
          isSignUp
            ? 'No pudimos crear la cuenta. Revisa los datos e inténtalo de nuevo.'
            : 'Email o contraseña incorrectos.',
        )
        setIsSigningIn(false)
        return
      }

      router.push('/schemas')
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
            Usa tu email y contraseña para abrir /schemas y retomar cualquier
            workspace guardado.
          </p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={handleEmailAuth}
          suppressHydrationWarning
        >
          {isSignUp ? (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isSigningIn}
                suppressHydrationWarning
              />
            </div>
          ) : null}

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
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
            {isSigningIn
              ? 'Procesando...'
              : isSignUp
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
          </Button>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              setMode(isSignUp ? 'sign-in' : 'sign-up')
              setErrorMessage(null)
            }}
            disabled={isSigningIn}
          >
            {isSignUp
              ? 'Ya tienes cuenta? Inicia sesión'
              : 'No tienes cuenta? Crea una'}
          </button>
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
