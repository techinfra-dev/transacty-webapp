import { createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router'
import {
  getAuthUser,
  isAuthenticated,
} from '../features/auth/services/authSession.ts'
import {
  getPayoutPinOnboardingTarget,
  isPathAllowedDuringMfaSetup,
  isPathAllowedDuringPayoutPinSetup,
} from '../features/auth/utils/postAuthNavigation.ts'
import { isAdminRole } from '../utils/portalRoles.ts'
import { hydratePortalEnvironmentForUser } from '../store/portalEnvironmentStore.ts'
import { Route as rootRoute } from './__root.tsx'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' })
    }
    const user = getAuthUser()
    hydratePortalEnvironmentForUser(user?.merchantId ?? null)
    if (
      user?.mfaSetupRequired &&
      !isPathAllowedDuringMfaSetup(location.pathname)
    ) {
      throw redirect({
        to: '/dashboard/settings',
        search: { tab: 'security' },
      })
    }
    if (
      user &&
      !user.mfaSetupRequired &&
      user.payoutPinSetupRequired &&
      !isPathAllowedDuringPayoutPinSetup(
        location.pathname,
        isAdminRole(user.role),
      )
    ) {
      throw redirect({
        to: getPayoutPinOnboardingTarget(isAdminRole(user.role)),
      })
    }
  },
  component: lazyRouteComponent(
    () => import('../layouts/DashboardLayout.tsx'),
    'DashboardLayout',
  ),
})
