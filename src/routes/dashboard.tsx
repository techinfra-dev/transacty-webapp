import { createRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '../features/auth/services/authSession.ts'
import { DashboardLayout } from '../layouts/DashboardLayout.tsx'
import { Route as rootRoute } from './__root.tsx'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayout,
})
