import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { payoutApprovalStatusSchema } from '../features/dashboard/services/payoutApprovalsSchemas.ts'
import type { PayoutApprovalStatus } from '../features/dashboard/services/payoutApprovalsSchemas.ts'
import { Route as dashboardRoute } from './dashboard.tsx'

export type PayoutApprovalsSearch = {
  status?: PayoutApprovalStatus
}

export function parsePayoutApprovalsSearch(
  search: Record<string, unknown>,
): PayoutApprovalsSearch {
  const parsed = payoutApprovalStatusSchema.safeParse(search.status)
  return parsed.success ? { status: parsed.data } : {}
}

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/payout-approvals',
  validateSearch: parsePayoutApprovalsSearch,
  component: lazyRouteComponent(
    () => import('../features/dashboard/pages/DashboardPayoutApprovalsPage.tsx'),
    'DashboardPayoutApprovalsPage',
  ),
})
