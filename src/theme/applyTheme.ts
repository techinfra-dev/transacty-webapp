export type ColorScheme = 'light' | 'dark'

const STORAGE_KEY = 'transcaty-ui-preferences'

export function readStoredColorScheme(): ColorScheme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return 'light'
    }
    const parsed = JSON.parse(raw) as {
      state?: { colorScheme?: ColorScheme }
    }
    return parsed.state?.colorScheme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyColorScheme(scheme: ColorScheme) {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  if (scheme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
  root.style.colorScheme = scheme
}
