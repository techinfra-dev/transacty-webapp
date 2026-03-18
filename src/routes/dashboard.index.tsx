import { createRoute } from '@tanstack/react-router'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: DashboardPage,
})
