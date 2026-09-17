import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { parsePayoutApprovalsSearch } from './dashboard.payout-approvals.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/payout-approvals/$approvalId',
  validateSearch: parsePayoutApprovalsSearch,
  component: lazyRouteComponent(
    () =>
      import('../features/dashboard/pages/DashboardPayoutApprovalDetailPage.tsx'),
    'DashboardPayoutApprovalDetailPage',
  ),
})
