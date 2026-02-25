'use client'

import { useConfigStore } from '@/stores/config'
import { useEffect } from 'react'

export function ThemeSync() {
  const isDarkMode = useConfigStore((state) => state.isDarkMode)
  const isThemeHydrated = useConfigStore((state) => state.isThemeHydrated)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (isThemeHydrated) {
      document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light'
    }
  }, [isDarkMode, isThemeHydrated])

  return null
}
