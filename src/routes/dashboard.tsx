import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'
import {
  getAuthUser,
  isAuthenticated,
} from '../features/auth/services/authSession.ts'
import { hydratePortalEnvironmentForUser } from '../store/portalEnvironmentStore.ts'
import { Route as rootRoute } from './__root.tsx'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    hydratePortalEnvironmentForUser(getAuthUser()?.merchantId ?? null)
  },
  component: lazyRouteComponent(
    () => import('../layouts/DashboardLayout.tsx'),
    'DashboardLayout',
  ),
})
