import { getAuthUser } from '../services/authSession.ts'

/** Destination after login / signup / MFA verify. */
export function getPostAuthNavigateOptions():
  | { to: '/dashboard/settings'; search: { tab: 'security' } }
  | { to: '/dashboard' } {
  const user = getAuthUser()
  if (user?.mfaSetupRequired) {
    return {
      to: '/dashboard/settings',
      search: { tab: 'security' },
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
