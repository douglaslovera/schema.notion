'use client'

import { Button } from '@/components/ui/button'
import { Moon, Sun } from '@/components/ui/icons'
import { useConfigStore } from '@/stores/config'
import { useEffect, useState } from 'react'

type ThemeToggleButtonProps = {
  compact?: boolean
  className?: string
}

export function ThemeToggleButton({
  compact = false,
  className,
}: ThemeToggleButtonProps) {
  const { isDarkMode, setDarkMode } = useConfigStore()
  const [hasMounted, setHasMounted] = useState(false)
  const displayedDarkMode = hasMounted && isDarkMode

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? 'icon' : 'sm'}
      onClick={() => setDarkMode(!isDarkMode)}
      aria-label={displayedDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={displayedDarkMode ? 'Tema oscuro activo' : 'Tema claro activo'}
      className={className}
    >
      {displayedDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {!compact && <span>{displayedDarkMode ? 'Claro' : 'Oscuro'}</span>}
    </Button>
  )
}
