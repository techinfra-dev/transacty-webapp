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
import {
  createPyusdPaymentIntentPayloadSchema,
  getPyusdPaymentIntentId,
  pyusdPaymentIntentSchema,
  type CreatePyusdPaymentIntentPayload,
  type PyusdPaymentIntent,
} from './pyusdPaymentIntentSchemas.ts'

function getPyusdPaymentIntentErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (responseData.code === 'payment_unavailable') {
      return 'PYUSD checkout is live-only. Switch the portal to Live and try again — Tekko has no sandbox.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable PYUSD in Settings → Markets before creating a payment intent.'
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
  return 'Unable to complete PYUSD payment intent right now.'
}

export async function createPyusdPaymentIntent(
  payload: CreatePyusdPaymentIntentPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<PyusdPaymentIntent> {
  try {
    const body = createPyusdPaymentIntentPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/pyusd/payment-intents', body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(
          'me/pyusd/payment-intents',
          body,
        ),
      }),
    })
    const created = pyusdPaymentIntentSchema.parse(response.data)
    releaseIdempotencyKey('me/pyusd/payment-intents', body)
    return created
  } catch (error) {
    throw new Error(getPyusdPaymentIntentErrorMessage(error))
  }
}

export async function getPyusdPaymentIntent(
  transactionId: string,
): Promise<PyusdPaymentIntent> {
  try {
    const response = await axiosInstance.get(
      `me/pyusd/payment-intents/${transactionId}`,
      {
        headers: getPortalAuthHeaders(),
        // Live-only: omit test environment so Tekko does not fail closed.
        params: { environment: 'live' },
      },
    )
    return pyusdPaymentIntentSchema.parse(response.data)
  } catch (error) {
    throw new Error(getPyusdPaymentIntentErrorMessage(error))
  }
}

export { getPyusdPaymentIntentId }
