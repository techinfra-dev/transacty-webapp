import { useEffect } from 'react'
import { applyColorScheme } from '../theme/applyTheme.ts'
import { useUiPreferencesStore } from '../store/uiPreferencesStore.ts'

export function useThemeSync() {
  const colorScheme = useUiPreferencesStore((state) => state.colorScheme)

  useEffect(() => {
    applyColorScheme(colorScheme)
  }, [colorScheme])
}
