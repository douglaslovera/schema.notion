'use client'

import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/config'
import { Moon, Sun } from 'lucide-react'

type ThemeToggleButtonProps = {
  compact?: boolean
  className?: string
}

export function ThemeToggleButton({
  compact = false,
  className,
}: ThemeToggleButtonProps) {
  const { isDarkMode, setDarkMode } = useConfigStore()

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? 'icon' : 'sm'}
      onClick={() => setDarkMode(!isDarkMode)}
      aria-label={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDarkMode ? 'Tema oscuro activo' : 'Tema claro activo'}
      className={className}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {!compact && <span>{isDarkMode ? 'Claro' : 'Oscuro'}</span>}
    </Button>
  )
}
