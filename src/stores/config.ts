'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ConfigStore {
  userId: string | null
  isDarkMode: boolean
  isThemeHydrated: boolean
  chatListCollapsed: boolean
  setUserId: (userId: string) => void
  setDarkMode: (isDarkMode: boolean) => void
  setThemeHydrated: (isThemeHydrated: boolean) => void
  setChatListCollapsed: (collapsed: boolean) => void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      userId: null,
      isDarkMode: false,
      isThemeHydrated: false,
      chatListCollapsed: false,
      setUserId: (userId: string) => {
        set({ userId })
      },
      setDarkMode: (isDarkMode: boolean) => {
        set({ isDarkMode })
      },
      setThemeHydrated: (isThemeHydrated: boolean) => {
        set({ isThemeHydrated })
      },
      setChatListCollapsed: (collapsed: boolean) => {
        set({ chatListCollapsed: collapsed })
      },
    }),
    {
      name: 'config-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        userId: state.userId,
        chatListCollapsed: state.chatListCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setThemeHydrated(true)
      },
    },
  ),
)
