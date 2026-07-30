import { getAuthToken } from '../features/auth/services/authSession.ts'
import { createIdempotencyKey } from '../utils/idempotency.ts'

export type PortalRequestHeaderOptions = {
  /** Short-lived JWT from POST auth/step-up */
  stepUpToken?: string | null
  /** Send a fresh Idempotency-Key (money creates) */
  idempotency?: boolean
  /** Or pass a specific key to reuse on retry */
  idempotencyKey?: string
}

export function getPortalAuthHeaders(
  options: PortalRequestHeaderOptions = {},
): Record<string, string> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }

  if (options.stepUpToken) {
    headers['X-Portal-Step-Up'] = options.stepUpToken
  }

  if (options.idempotency || options.idempotencyKey) {
    headers['Idempotency-Key'] =
      options.idempotencyKey ?? createIdempotencyKey()
  }

  return headers
}
