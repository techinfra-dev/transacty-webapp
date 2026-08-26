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
  createBrPixPayinPayloadSchema,
  brPixPayinResponseSchema,
  type CreateBrPixPayinPayload,
  type BrPixPayinResponse,
} from './brPayinSchemas.ts'

function getBrPayinApiErrorMessage(error: unknown) {
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
      return 'Enable Brazil in Settings → Markets before creating PIX pay-ins.'
    }
    if (responseData.code === 'payment_provider_rejected') {
      return 'The payment provider rejected this pay-in. Check details and try again.'
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Unable to create Brazil PIX pay-in right now.'
}

export async function createBrPixPayin(
  payload: CreateBrPixPayinPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<BrPixPayinResponse> {
  try {
    const body = createBrPixPayinPayloadSchema.parse({
      ...payload,
      paymentMethodCode: 'PIX',
    })
    const response = await axiosInstance.post('me/br/payins', body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey('me/br/payins', body),
      }),
    })
    const created = brPixPayinResponseSchema.parse(response.data)
    releaseIdempotencyKey('me/br/payins', body)
    return created
  } catch (error) {
    throw new Error(getBrPayinApiErrorMessage(error))
  }
}
