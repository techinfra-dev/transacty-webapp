import { createRoute } from '@tanstack/react-router'
import { DashboardTransactionsPage } from '../features/dashboard/pages/DashboardTransactionsPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/transactions',
  component: DashboardTransactionsPage,
})
