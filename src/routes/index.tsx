import { createRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../features/auth/services/authSession.ts'
import { Route as rootRoute } from './__root.tsx'

function IndexRouteRedirect() {
  return null
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: isAuthenticated() ? '/dashboard' : '/login' })
  },
  component: IndexRouteRedirect,
})
