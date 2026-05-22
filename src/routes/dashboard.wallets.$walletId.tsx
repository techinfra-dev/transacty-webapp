import { createRoute } from '@tanstack/react-router'
import { DashboardWalletPage } from '../features/dashboard/pages/DashboardWalletPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/wallets/$walletId',
  component: DashboardWalletPage,
})
