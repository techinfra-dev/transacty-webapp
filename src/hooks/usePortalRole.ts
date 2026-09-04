import { useMemo } from 'react'
import {
  getAuthUser,
  subscribeToAuthSessionUpdates,
} from '../features/auth/services/authSession.ts'
import {
  canManageDeveloperSettings,
  canWriteMoney,
  getPortalRoleFromSession,
  isAdminRole,
} from '../utils/portalRoles.ts'
import { useSyncExternalStore } from 'react'

function subscribe(listener: () => void) {
  return subscribeToAuthSessionUpdates(listener)
}

function getSnapshot() {
  return getAuthUser()
}

export function usePortalRole() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return useMemo(() => {
    const role = getPortalRoleFromSession(user)
    return {
      user,
      role,
      isAdmin: isAdminRole(user?.role),
      canWriteMoney: canWriteMoney(user?.role),
      canManageDeveloperSettings: canManageDeveloperSettings(user?.role),
      mfaEnabled: Boolean(user?.mfaEnabled),
      mfaSetupRequired: Boolean(user?.mfaSetupRequired),
      payoutPinConfigured: Boolean(user?.payoutPinConfigured),
      payoutPinSetupRequired: Boolean(user?.payoutPinSetupRequired),
    }
  }, [user])
}
