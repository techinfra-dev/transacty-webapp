import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import {
  isCustomerDetailTabId,
  normalizeCustomerDetailTab,
  type CustomerDetailTabId,
} from '../features/dashboard/components/customers/customerDetailTabs.ts'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/customers/$customerId',
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: CustomerDetailTabId } => {
    const tab = typeof search.tab === 'string' ? search.tab : undefined
    const normalized = normalizeCustomerDetailTab(tab)
    if (normalized) {
      return { tab: normalized }
    }
    if (tab && isCustomerDetailTabId(tab)) {
      return { tab }
    }
    return {}
  },
  component: lazyRouteComponent(
    () => import('../features/dashboard/pages/DashboardCustomerPage.tsx'),
    'DashboardCustomerPage',
  ),
})
