import { Outlet, createRootRoute } from '@tanstack/react-router'

function RootLayout() {
  return (
    <main className="app-shell min-h-screen bg-(--color-background) text-(--color-foreground)">
      <Outlet />
    </main>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
