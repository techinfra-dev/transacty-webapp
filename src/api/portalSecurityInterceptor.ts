import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from './axiosInstance.ts'
import { apiErrorSchema } from '../features/auth/services/authSchemas.ts'
import type { PortalStepUpAction } from '../features/auth/services/authSchemas.ts'
import {
  clearAuthSession,
  getAuthToken,
  getAuthUser,
  updateAuthSessionUser,
} from '../features/auth/services/authSession.ts'
import { usePortalStepUpStore } from '../store/portalStepUpStore.ts'

type RetriableConfig = InternalAxiosRequestConfig & {
  portalStepUpRetried?: boolean
}

const STEP_UP_ACTIONS: PortalStepUpAction[] = [
  'money.write',
  'api_keys.write',
  'webhook.write',
  'audit.export',
  'any',
]

function toStepUpAction(value: string | undefined): PortalStepUpAction {
  return STEP_UP_ACTIONS.includes(value as PortalStepUpAction)
    ? (value as PortalStepUpAction)
    : 'any'
}

/** Auth routes answer 401/403 as normal form feedback, not as a dead session. */
function isAuthRoute(url: string | undefined) {
  return (url ?? '').replace(/^\/+/, '').startsWith('auth/')
}

export function registerPortalSecurityInterceptor(handlers: {
  onMfaSetupRequired: () => void
  onSessionExpired: () => void
}) {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!(error instanceof AxiosError) || !error.response) {
        return Promise.reject(error)
      }

      const config = error.config as RetriableConfig | undefined
      const status = error.response.status
      const parsed = apiErrorSchema.safeParse(error.response.data)

      // A3: revoke-sessions on another device bumps sessionVersion, so this
      // tab's JWT is dead and every later call would fail silently.
      if (status === 401 && !isAuthRoute(config?.url) && getAuthToken()) {
        clearAuthSession()
        handlers.onSessionExpired()
        return Promise.reject(error)
      }

      if (!parsed.success) {
        return Promise.reject(error)
      }

      // Local session claimed MFA was on, but the server has no enrollment.
      if (
        status === 403 &&
        isAuthRoute(config?.url) &&
        /must be enrolled/i.test(parsed.data.message)
      ) {
        updateAuthSessionUser({ mfaEnabled: false })
        return Promise.reject(error)
      }

      // A7: server enforces MFA enrollment before any /me/* work.
      if (parsed.data.mfaSetupRequired) {
        updateAuthSessionUser({ mfaSetupRequired: true })
        handlers.onMfaSetupRequired()
        return Promise.reject(error)
      }

      // A2: local session thought MFA was off, or the token expired mid-flow.
      if (!parsed.data.stepUpRequired || !config || config.portalStepUpRetried) {
        return Promise.reject(error)
      }

      if (!getAuthUser()?.mfaEnabled) {
        updateAuthSessionUser({ mfaEnabled: true })
      }

      const token = await usePortalStepUpStore.getState().openStepUp({
        action: toStepUpAction(parsed.data.action),
      })
      if (!token) {
        return Promise.reject(error)
      }

      config.portalStepUpRetried = true
      config.headers.set('X-Portal-Step-Up', token)
      return axiosInstance.request(config)
    },
  )
}
