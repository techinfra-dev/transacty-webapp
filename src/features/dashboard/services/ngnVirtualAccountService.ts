import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
import {
  getStableIdempotencyKey,
  releaseIdempotencyKey,
} from '../../../utils/idempotency.ts'
import { NIGERIA_LIVE_ONLY_ENVIRONMENT } from '../utils/nigeriaMarket.ts'
import {
  ngnVirtualAccountSchema,
  provisionNgnVirtualAccountPayloadSchema,
  type NgnVirtualAccount,
  type ProvisionNgnVirtualAccountPayload,
} from './ngnVirtualAccountSchemas.ts'

const VIRTUAL_ACCOUNT_PATH = 'me/ngn/virtual-account'

export function getNgnApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (responseData.code === 'payment_unavailable') {
      return 'Nigeria NGN is live-only. Switch the portal to Live and try again.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Nigeria in Settings → Markets before using NGN.'
    }
    if (
      typeof responseData.message === 'string' &&
      responseData.message.trim().length > 0
    ) {
      return responseData.message.trim()
    }
    if (
      typeof responseData.error === 'string' &&
      responseData.error.trim().length > 0
    ) {
      return responseData.error.trim()
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Unable to reach the Nigeria NGN service right now.'
}

export async function getNgnVirtualAccount(): Promise<NgnVirtualAccount> {
  try {
    const response = await axiosInstance.get(VIRTUAL_ACCOUNT_PATH, {
      headers: getPortalAuthHeaders(),
      params: { environment: NIGERIA_LIVE_ONLY_ENVIRONMENT },
    })
    return ngnVirtualAccountSchema.parse(response.data)
  } catch (error) {
    throw new Error(getNgnApiErrorMessage(error))
  }
}

/**
 * Submits BVN Basic and provisions the permanent virtual account.
 * The BVN is forwarded once and never returned, cached, or logged here — the
 * idempotency helper only retains a hash of the request body.
 */
export async function provisionNgnVirtualAccount(
  payload: ProvisionNgnVirtualAccountPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<NgnVirtualAccount> {
  const body = provisionNgnVirtualAccountPayloadSchema.parse(payload)
  try {
    const response = await axiosInstance.post(VIRTUAL_ACCOUNT_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(VIRTUAL_ACCOUNT_PATH, body),
      }),
    })
    const account = ngnVirtualAccountSchema.parse(response.data)
    releaseIdempotencyKey(VIRTUAL_ACCOUNT_PATH, body)
    return account
  } catch (error) {
    throw new Error(getNgnApiErrorMessage(error))
  }
}
