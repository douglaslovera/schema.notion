'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from '@/components/ui/icons'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LogoutButtonProps = {
  className?: string
  label?: string
  iconOnly?: boolean
}

export function LogoutButton({
  className,
  label = 'Salir',
  iconOnly = true,
}: LogoutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await authClient.signOut()
      router.push('/sign-in')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size={iconOnly ? 'icon' : 'sm'}
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className={className}
    >
      <LogOut className="h-5 w-5" />
      {!iconOnly && <span>{label}</span>}
    </Button>
  )
}
