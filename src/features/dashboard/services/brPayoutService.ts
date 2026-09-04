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
import { assertNotPayoutPinError } from '../utils/payoutPinErrors.ts'
import {
  createBrPayoutPayloadSchema,
  createBrPayoutResponseSchema,
  type CreateBrPayoutPayload,
} from './brPayoutSchemas.ts'

function getBrPayoutApiErrorMessage(error: unknown) {
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
      return 'Enable Brazil in Settings → Markets before sending PIX payouts.'
    }
    if (responseData.code === 'payment_provider_rejected') {
      return 'The payment provider rejected this payout. Check recipient details and try again.'
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Unable to create Brazil PIX payout right now.'
}

export async function createBrPayout(
  payload: CreateBrPayoutPayload,
  options: PortalRequestHeaderOptions = {},
) {
  try {
    const validatedPayload = createBrPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/br/payouts', validatedPayload, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(
          'me/br/payouts',
          validatedPayload,
        ),
      }),
    })
    const created = createBrPayoutResponseSchema.parse(response.data)
    releaseIdempotencyKey('me/br/payouts', validatedPayload)
    return created
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getBrPayoutApiErrorMessage(error))
  }
}
