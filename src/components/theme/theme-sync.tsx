'use client'

import { useConfigStore } from '@/stores/config'
import { useEffect } from 'react'

export function ThemeSync() {
  const isDarkMode = useConfigStore((state) => state.isDarkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  return null
}
