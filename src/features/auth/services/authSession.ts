import type { AuthSessionResponse } from './authSchemas.ts'

const AUTH_TOKEN_KEY = 'transcaty.auth.token'
const AUTH_USER_KEY = 'transcaty.auth.user'

export interface AuthSessionUser {
  merchantId: string
  merchantSlug?: string
  email: string
  role: string
  merchantName: string
  needsActivation: boolean
  mfaEnabled: boolean
  mfaSetupRequired: boolean
}

const AUTH_SESSION_UPDATED_EVENT = 'transcaty:auth-session-updated'

function notifyAuthSessionUpdated() {
  window.dispatchEvent(new Event(AUTH_SESSION_UPDATED_EVENT))
}

export function storeAuthSession(payload: AuthSessionResponse) {
  sessionStorage.setItem(AUTH_TOKEN_KEY, payload.token)
  sessionStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify({
      merchantId: payload.merchantId,
      merchantSlug: payload.merchantSlug ?? payload.merchant.slug,
      email: payload.email,
      role: payload.role,
      merchantName: payload.merchant.businessName ?? payload.merchant.name,
      needsActivation: payload.needsActivation,
      mfaEnabled: payload.mfaEnabled ?? false,
      mfaSetupRequired: payload.mfaSetupRequired ?? false,
    } satisfies AuthSessionUser),
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
    const parsedUser = JSON.parse(rawUser) as Partial<AuthSessionUser>
    if (
      typeof parsedUser.merchantId === 'string' &&
      typeof parsedUser.email === 'string' &&
      typeof parsedUser.role === 'string' &&
      typeof parsedUser.merchantName === 'string' &&
      typeof parsedUser.needsActivation === 'boolean'
    ) {
      return {
        merchantId: parsedUser.merchantId,
        merchantSlug:
          typeof parsedUser.merchantSlug === 'string'
            ? parsedUser.merchantSlug
            : undefined,
        email: parsedUser.email,
        role: parsedUser.role,
        merchantName: parsedUser.merchantName,
        needsActivation: parsedUser.needsActivation,
        mfaEnabled: Boolean(parsedUser.mfaEnabled),
        mfaSetupRequired: Boolean(parsedUser.mfaSetupRequired),
      }
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
  partialUser: Partial<
    Pick<
      AuthSessionUser,
      | 'merchantName'
      | 'role'
      | 'email'
      | 'mfaEnabled'
      | 'mfaSetupRequired'
      | 'merchantSlug'
    >
  >,
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

export function markMfaEnrolledInSession() {
  updateAuthSessionUser({
    mfaEnabled: true,
    mfaSetupRequired: false,
  })
}
