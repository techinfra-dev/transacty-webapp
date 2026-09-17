import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
import {
  getStableIdempotencyKey,
  releaseIdempotencyKey,
} from '../../../utils/idempotency.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import { assertNotPayoutPinError } from '../utils/payoutPinErrors.ts'
import { parsePayoutCreateResponse } from './payoutCreateResult.ts'
import type { PayoutCreateResult } from './payoutCreateResult.ts'
import {
  createEurPayoutPayloadSchema,
  eurPayoutApproveResponseSchema,
  eurPayoutInstanceSchema,
  type CreateEurPayoutPayload,
  type EurPayoutApproveResponse,
  type EurPayoutInstance,
} from './eurPayoutSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

function getEurPayoutApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
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
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Europe in Settings → Markets before sending EUR payouts.'
    }
    if (responseData.code === 'payment_provider_rejected') {
      return 'The payment provider rejected this payout. Try again later or contact support with the transaction ID.'
    }
    if (responseData.code === 'payment_provider_unavailable') {
      return 'The payment provider is temporarily unavailable. Retry in a few minutes.'
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Unable to complete EUR payout request right now.'
}

export async function createEurPayout(
  payload: CreateEurPayoutPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<PayoutCreateResult<EurPayoutInstance>> {
  try {
    const body = createEurPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/eur/payout-instances', body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey('me/eur/payout-instances', body),
      }),
    })
    const created = parsePayoutCreateResponse(
      response.data,
      eurPayoutInstanceSchema,
      response.status,
    )
    releaseIdempotencyKey('me/eur/payout-instances', body)
    return created
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getEurPayoutApiErrorMessage(error))
  }
}

export async function approveEurPayout(
  params: {
    transactionId: string
    environment: PortalEnvironment
    /** Approving releases the money, so it carries the payout PIN too. */
    pin: string
  },
  options: PortalRequestHeaderOptions = {},
): Promise<EurPayoutApproveResponse> {
  try {
    const response = await axiosInstance.post(
      `me/eur/payout-instances/${encodeURIComponent(params.transactionId)}/approve`,
      { pin: params.pin },
      {
        headers: getPortalAuthHeaders({
          ...options,
          idempotencyKey: getStableIdempotencyKey(
            'me/eur/payout-instances/approve',
            params,
          ),
        }),
        params: {
          environment: params.environment,
        },
      },
    )
    return eurPayoutApproveResponseSchema.parse(response.data)
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getEurPayoutApiErrorMessage(error))
  }
}

export async function getEurPayoutInstance(params: {
  transactionId: string
  environment: PortalEnvironment
}): Promise<EurPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `me/eur/payout-instances/${encodeURIComponent(params.transactionId)}`,
      {
        headers: getAuthHeader(),
        params: {
          environment: params.environment,
        },
      },
    )
    return eurPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getEurPayoutApiErrorMessage(error))
  }
}
