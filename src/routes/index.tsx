import { createRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../features/auth/services/authSession.ts'
import { getPostAuthNavigateOptions } from '../features/auth/utils/postAuthNavigation.ts'
import { Route as rootRoute } from './__root.tsx'

function IndexRouteRedirect() {
  return null
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    throw redirect(getPostAuthNavigateOptions())
  },
  component: IndexRouteRedirect,
})
