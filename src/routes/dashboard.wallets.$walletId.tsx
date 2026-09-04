import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/wallets/$walletId',
  validateSearch: (
    search: Record<string, unknown>,
  ): { va?: 'bvn' } => {
    return search.va === 'bvn' ? { va: 'bvn' } : {}
  },
  component: lazyRouteComponent(
    () => import('../features/dashboard/pages/DashboardWalletPage.tsx'),
    'DashboardWalletPage',
  ),
})
