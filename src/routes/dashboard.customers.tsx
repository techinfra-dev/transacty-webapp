import { createRoute } from '@tanstack/react-router'
import { DashboardCustomersPage } from '../features/dashboard/pages/DashboardCustomersPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/customers',
  component: DashboardCustomersPage,
})
