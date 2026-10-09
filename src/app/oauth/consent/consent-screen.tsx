'use client'

import { Database } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ConsentScreenProps {
  consentCode: string | null
  clientName: string | null
  redirectHost: string | null
  email: string
}

const PERMISSIONS = [
  'Ver tus workspaces y sus diagramas',
  'Crear, renombrar, duplicar y eliminar workspaces',
  'Guardar cambios en los diagramas',
  'Activar o desactivar los enlaces públicos para compartir',
]

export function ConsentScreen({
  consentCode,
  clientName,
  redirectHost,
  email,
}: ConsentScreenProps) {
  const [pending, setPending] = useState<'accept' | 'deny' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const respond = async (accept: boolean) => {
    if (!consentCode || pending) return

    setPending(accept ? 'accept' : 'deny')
    setErrorMessage(null)

    try {
      const response = await fetch('/api/auth/oauth2/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accept, consent_code: consentCode }),
      })
      const data = (await response.json()) as { redirectURI?: string }

      if (!response.ok || !data.redirectURI) {
        throw new Error('Consent failed')
      }

      window.location.assign(data.redirectURI)
    } catch {
      setErrorMessage(
        'La solicitud expiró o no es válida. Vuelve a conectar desde tu cliente de IA.',
      )
      setPending(null)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-[0_1px_0_0_var(--line-subtle)] sm:p-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
            <Database className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium tracking-tight">schema.notion</p>
            <p className="text-[11px] text-muted-foreground">{email}</p>
          </div>
        </div>

        {consentCode && clientName ? (
          <>
            <div className="mt-8 space-y-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Conectar cliente MCP
              </p>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                {clientName} quiere acceder a tu cuenta.
              </h1>
              {redirectHost ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Te redirigiremos a{' '}
                  <span className="font-medium text-foreground">
                    {redirectHost}
                  </span>
                  . Acepta solo si tú iniciaste esta conexión.
                </p>
              ) : null}
            </div>

            <ul className="mt-6 space-y-2 text-sm">
              {PERMISSIONS.map((permission) => (
                <li key={permission} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  {permission}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => respond(false)}
                disabled={pending !== null}
              >
                {pending === 'deny' ? 'Cancelando...' : 'Cancelar'}
              </Button>
              <Button
                type="button"
                className="h-11 flex-1"
                onClick={() => respond(true)}
                disabled={pending !== null}
              >
                {pending === 'accept' ? 'Conectando...' : 'Permitir acceso'}
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-8 space-y-3">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">
              Solicitud no válida
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Esta solicitud de conexión no existe o ya expiró. Vuelve a
              conectar desde tu cliente de IA.
            </p>
          </div>
        )}

        {errorMessage ? (
          <p className="mt-4 text-sm text-destructive">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  )
}
