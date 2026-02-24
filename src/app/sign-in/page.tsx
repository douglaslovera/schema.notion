'use client'

import { authClient } from '@/lib/auth-client'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Schema.AI</h1>
          <p className="mt-2 text-sm text-slate-400">
            Inicia sesión con Google para continuar
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <p className="text-sm text-slate-400 text-center">
            Usa tu cuenta de Google para crear y gestionar tus chats de diseño
            de bases de datos.
          </p>
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Redirigiendo a Google...' : 'Continuar con Google'}
          </button>
        </div>
      </div>
    </div>
  )
}
