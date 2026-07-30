import type { AuthSessionUser } from '../features/auth/services/authSession.ts'
import { getAuthUser } from '../features/auth/services/authSession.ts'

export type PortalRole = 'admin' | 'finance' | 'viewer'

export function normalizePortalRole(role: string | null | undefined): PortalRole | string {
  const value = role?.trim().toLowerCase() ?? ''
  if (value === 'admin' || value === 'finance' || value === 'viewer') {
    return value
  }
  return value || 'viewer'
}

export function isAdminRole(role: string | null | undefined) {
  return normalizePortalRole(role) === 'admin'
}

export function canWriteMoney(role: string | null | undefined) {
  const normalized = normalizePortalRole(role)
  return normalized === 'admin' || normalized === 'finance'
}

export function canManageDeveloperSettings(role: string | null | undefined) {
  return isAdminRole(role)
}

export function getPortalRoleFromSession(user: AuthSessionUser | null = getAuthUser()) {
  return normalizePortalRole(user?.role)
}

export function assertCanWriteMoney(role: string | null | undefined = getAuthUser()?.role) {
  if (!canWriteMoney(role)) {
    throw new Error('Finance or admin role required for money operations')
  }
}

export function assertIsAdmin(role: string | null | undefined = getAuthUser()?.role) {
  if (!isAdminRole(role)) {
    throw new Error('Admin role required')
  }
}
