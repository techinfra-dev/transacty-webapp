import { Outlet, createRootRoute } from '@tanstack/react-router'
import { useThemeSync } from '../hooks/useThemeSync.ts'

function RootLayout() {
  useThemeSync()

  return (
    <main className="app-shell min-h-screen bg-(--color-background) text-(--color-foreground)">
      <Outlet />
    </main>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
