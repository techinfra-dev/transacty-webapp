import { createRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Route as dashboardRoute } from './dashboard.tsx'

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/onboarding/waiting-for-admin',
  component: lazyRouteComponent(
    () =>
      import('../features/dashboard/pages/OnboardingWaitingForAdminPage.tsx'),
    'OnboardingWaitingForAdminPage',
  ),
})
