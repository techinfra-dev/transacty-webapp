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
  createNgnPayoutPayloadSchema,
  ngnAccountVerificationSchema,
  ngnBanksResponseSchema,
  ngnPayoutInstanceSchema,
  verifyNgnAccountPayloadSchema,
  type CreateNgnPayoutPayload,
  type NgnAccountVerification,
  type NgnBank,
  type NgnPayoutInstance,
  type VerifyNgnAccountPayload,
} from './ngnPayoutSchemas.ts'

const PAYOUTS_PATH = 'me/ngn/payouts'

function getNgnPayoutApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (responseData.code === 'payment_unavailable') {
      return 'Nigeria NGN payouts are live-only. Switch the portal to Live and try again.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Nigeria in Settings → Markets before sending NGN payouts.'
    }
    if (
      responseData.code === 'insufficient_liquidity' ||
      responseData.code === 'payment_provider_unavailable'
    ) {
      // Can fail closed even when the merchant NGN wallet has balance.
      return 'This payout could not be sent right now. Your balance was not debited — retry shortly, or contact support with the transaction ID if it persists.'
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
  return 'Unable to complete the NGN payout right now.'
}

export async function listNgnBanks(search?: string): Promise<NgnBank[]> {
  try {
    const response = await axiosInstance.get('me/ngn/banks', {
      headers: getPortalAuthHeaders(),
      params: {
        environment: NIGERIA_LIVE_ONLY_ENVIRONMENT,
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    })
    const parsed = ngnBanksResponseSchema.parse(response.data)
    return Array.isArray(parsed) ? parsed : parsed.items
  } catch (error) {
    throw new Error(getNgnPayoutApiErrorMessage(error))
  }
}

/** Name enquiry — always run before creating a payout. */
export async function verifyNgnAccount(
  payload: VerifyNgnAccountPayload,
): Promise<NgnAccountVerification> {
  try {
    const body = verifyNgnAccountPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/ngn/verify-account', body, {
      headers: getPortalAuthHeaders(),
    })
    return ngnAccountVerificationSchema.parse(response.data)
  } catch (error) {
    throw new Error(getNgnPayoutApiErrorMessage(error))
  }
}

export async function createNgnPayout(
  payload: CreateNgnPayoutPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<NgnPayoutInstance> {
  try {
    const body = createNgnPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post(PAYOUTS_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(PAYOUTS_PATH, body),
      }),
    })
    const created = ngnPayoutInstanceSchema.parse(response.data)
    releaseIdempotencyKey(PAYOUTS_PATH, body)
    return created
  } catch (error) {
    throw new Error(getNgnPayoutApiErrorMessage(error))
  }
}

export async function getNgnPayout(
  transactionId: string,
): Promise<NgnPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `${PAYOUTS_PATH}/${encodeURIComponent(transactionId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment: NIGERIA_LIVE_ONLY_ENVIRONMENT },
      },
    )
    return ngnPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getNgnPayoutApiErrorMessage(error))
  }
}
