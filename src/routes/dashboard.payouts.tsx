import { createRoute } from '@tanstack/react-router'
import { DashboardPayoutsPage } from '../features/dashboard/pages/DashboardPayoutsPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/payouts',
  component: DashboardPayoutsPage,
})
