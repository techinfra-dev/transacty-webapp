import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/settings',
  component: lazyRouteComponent(
    () => import('../features/dashboard/pages/DashboardSettingsPage.tsx'),
    'DashboardSettingsPage',
  ),
})
