'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface ConfigStore {
  userId: string | null
  isDarkMode: boolean
  chatListCollapsed: boolean
  setUserId: (userId: string) => void
  setDarkMode: (isDarkMode: boolean) => void
  setChatListCollapsed: (collapsed: boolean) => void
}

// ThemeScript already resolved the theme onto <html> before paint, so the class
// is the source of truth. Seeding from it keeps ThemeSync from undoing that when
// nothing is persisted yet (first visit on a dark OS).
const getInitialDarkMode = () =>
  typeof document !== 'undefined' &&
  document.documentElement.classList.contains('dark')

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      userId: null,
      isDarkMode: getInitialDarkMode(),
      chatListCollapsed: false,
      setUserId: (userId: string) => {
        set({ userId })
      },
      setDarkMode: (isDarkMode: boolean) => {
        set({ isDarkMode })
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
    },
  ),
)
