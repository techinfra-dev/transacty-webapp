import { createRoute } from '@tanstack/react-router'
import { DashboardWalletsIndexPage } from '../features/dashboard/pages/DashboardWalletsIndexPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/wallets',
  component: DashboardWalletsIndexPage,
})
