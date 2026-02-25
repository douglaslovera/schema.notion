'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ConfigStore {
  userId: string | null
  isDarkMode: boolean
  isThemeHydrated: boolean
  setUserId: (userId: string) => void
  setDarkMode: (isDarkMode: boolean) => void
  setThemeHydrated: (isThemeHydrated: boolean) => void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      userId: null,
      isDarkMode: false,
      isThemeHydrated: false,
      setUserId: (userId: string) => {
        set({ userId })
      },
      setDarkMode: (isDarkMode: boolean) => {
        set({ isDarkMode })
      },
      setThemeHydrated: (isThemeHydrated: boolean) => {
        set({ isThemeHydrated })
      },
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        userId: state.userId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setThemeHydrated(true)
      },
    },
  ),
)
