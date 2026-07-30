import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import type { SettingsTabId } from '../features/dashboard/components/settings/settingsTabs.ts'
import { Route as dashboardRoute } from './dashboard.tsx'

const SETTINGS_TAB_IDS = new Set<SettingsTabId>([
  'profile',
  'security',
  'markets',
  'business-preference',
  'settlement-accounts',
  'team',
  'permissions',
  'whitelisted-ip-addresses',
  'reconciliation-report',
  'api-keys',
  'webhooks',
])

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/settings',
  validateSearch: (search: Record<string, unknown>): { tab?: SettingsTabId } => {
    const tab = typeof search.tab === 'string' ? search.tab : undefined
    if (tab && SETTINGS_TAB_IDS.has(tab as SettingsTabId)) {
      return { tab: tab as SettingsTabId }
    }
    return {}
  },
  component: lazyRouteComponent(
    () => import('../features/dashboard/pages/DashboardSettingsPage.tsx'),
    'DashboardSettingsPage',
  ),
})
