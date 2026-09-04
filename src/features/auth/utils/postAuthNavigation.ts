import { isAdminRole } from '../../../utils/portalRoles.ts'
import { getAuthUser } from '../services/authSession.ts'

export type PostAuthNavigateOptions =
  | { to: '/dashboard/settings'; search: { tab: 'security' } }
  | { to: '/dashboard/onboarding/payout-pin' }
  | { to: '/dashboard/onboarding/waiting-for-admin' }
  | { to: '/dashboard' }
  | { to: '/reset-payout-pin'; search: { token: string } }

/** Destination after login / signup / MFA verify. */
export function getPostAuthNavigateOptions(
  nextPath?: string | null,
): PostAuthNavigateOptions {
  const user = getAuthUser()
  if (user?.mfaSetupRequired) {
    return {
      to: '/dashboard/settings',
      search: { tab: 'security' },
    }
  }
  if (user?.payoutPinSetupRequired) {
    return isAdminRole(user.role)
      ? { to: '/dashboard/onboarding/payout-pin' }
      : { to: '/dashboard/onboarding/waiting-for-admin' }
  }
  if (nextPath) {
    const resetMatch = nextPath.match(/^\/reset-payout-pin(?:\?token=([^&]+))?/)
    if (resetMatch) {
      return {
        to: '/reset-payout-pin',
        search: { token: decodeURIComponent(resetMatch[1] ?? '') },
      }
    }
  }
  return { to: '/dashboard' }
}

/** Paths allowed while MFA enrollment is required by policy. */
export function isPathAllowedDuringMfaSetup(pathname: string) {
  return (
    pathname === '/dashboard/settings' ||
    pathname.startsWith('/dashboard/settings/')
  )
}

export function isPathAllowedDuringPayoutPinSetup(
  pathname: string,
  isAdmin: boolean,
) {
  if (
    pathname === '/reset-payout-pin' ||
    pathname === '/forgot-payout-pin'
  ) {
    return true
  }
  if (isAdmin) {
    return (
      pathname === '/dashboard/onboarding/payout-pin' ||
      pathname === '/dashboard/settings' ||
      pathname.startsWith('/dashboard/settings/')
    )
  }
  return pathname === '/dashboard/onboarding/waiting-for-admin'
}

export function getPayoutPinOnboardingTarget(isAdmin: boolean) {
  return isAdmin
    ? ('/dashboard/onboarding/payout-pin' as const)
    : ('/dashboard/onboarding/waiting-for-admin' as const)
}
