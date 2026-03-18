import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UiPreferencesState {
  areBalancesHidden: boolean
  toggleBalancesVisibility: () => void
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      areBalancesHidden: false,
      toggleBalancesVisibility: () =>
        set((state) => ({
          areBalancesHidden: !state.areBalancesHidden,
        })),
    }),
    {
      name: 'transcaty-ui-preferences',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
