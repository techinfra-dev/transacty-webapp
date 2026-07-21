import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ColorScheme } from '../theme/applyTheme.ts'

interface UiPreferencesState {
  areBalancesHidden: boolean
  isDashboardSidebarCollapsed: boolean
  colorScheme: ColorScheme
  toggleBalancesVisibility: () => void
  toggleDashboardSidebar: () => void
  setColorScheme: (scheme: ColorScheme) => void
  toggleColorScheme: () => void
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      areBalancesHidden: false,
      isDashboardSidebarCollapsed: false,
      colorScheme: 'light',
      toggleBalancesVisibility: () =>
        set((state) => ({
          areBalancesHidden: !state.areBalancesHidden,
        })),
      toggleDashboardSidebar: () =>
        set((state) => ({
          isDashboardSidebarCollapsed: !state.isDashboardSidebarCollapsed,
        })),
      setColorScheme: (colorScheme) => set({ colorScheme }),
      toggleColorScheme: () =>
        set((state) => ({
          colorScheme: state.colorScheme === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'transcaty-ui-preferences',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
