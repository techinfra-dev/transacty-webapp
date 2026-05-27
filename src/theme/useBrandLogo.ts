import { useUiPreferencesStore } from '../store/uiPreferencesStore.ts'

const LOGO_LIGHT = '/TRANSACTY-LOGO-OBSIDIAN-BROWN.png'
const LOGO_DARK = '/TRENSACTY-LOGO-IVORY-DUST.png'

export function useBrandLogoPath() {
  const colorScheme = useUiPreferencesStore((state) => state.colorScheme)
  return colorScheme === 'dark' ? LOGO_DARK : LOGO_LIGHT
}
