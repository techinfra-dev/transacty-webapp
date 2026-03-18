import { createRoute } from '@tanstack/react-router'
import { DashboardSettingsPage } from '../features/dashboard/pages/DashboardSettingsPage.tsx'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/settings',
  component: DashboardSettingsPage,
})
