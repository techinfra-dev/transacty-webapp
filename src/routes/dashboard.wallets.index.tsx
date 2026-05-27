import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/wallets',
  component: lazyRouteComponent(
    () => import('../features/dashboard/pages/DashboardWalletsIndexPage.tsx'),
    'DashboardWalletsIndexPage',
  ),
})
