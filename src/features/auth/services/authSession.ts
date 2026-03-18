import type { AuthResponse } from './authSchemas.ts'

const AUTH_TOKEN_KEY = 'transcaty.auth.token'
const AUTH_USER_KEY = 'transcaty.auth.user'

export interface AuthSessionUser {
  merchantId: string
  email: string
  role: string
  merchantName: string
  needsActivation: boolean
}

const AUTH_SESSION_UPDATED_EVENT = 'transcaty:auth-session-updated'

function notifyAuthSessionUpdated() {
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT))
}

export function storeAuthSession(payload: AuthResponse) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, payload.token)
  sessionStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      merchantId: payload.merchantId,
      email: payload.email,
      role: payload.role,
      merchantName: payload.merchant.name,
      needsActivation: payload.needsActivation,
    }),
  )
  notifyAuthSessionUpdated()
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
  notifyAuthSessionUpdated()
}

export function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_KEY)
}

export function getAuthUser(): AuthSessionUser | null {
  const rawUser = sessionStorage.getItem(AUTH_USER_KEY)
  if (!rawUser) {
    return null
  }

  try {
    const parsedUser = JSON.parse(rawUser) as AuthSessionUser
    if (
      typeof parsedUser.merchantId === 'string' &&
      typeof parsedUser.email === 'string' &&
      typeof parsedUser.role === 'string' &&
      typeof parsedUser.merchantName === 'string' &&
      typeof parsedUser.needsActivation === 'boolean'
    ) {
      return parsedUser
    }
    return null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}

export function subscribeToAuthSessionUpdates(listener: () => void) {
  const handler = () => listener()
  window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handler)
  return () => window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handler)
}

export function updateAuthSessionUser(
  partialUser: Partial<Pick<AuthSessionUser, 'merchantName' | 'role' | 'email'>>,
) {
  const currentUser = getAuthUser()
  if (!currentUser) {
    return
  }
  const nextUser: AuthSessionUser = {
    ...currentUser,
    ...partialUser,
  }
  sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser))
  notifyAuthSessionUpdated()
}
