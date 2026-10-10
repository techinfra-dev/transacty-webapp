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
import { KENYA_LIVE_ONLY_ENVIRONMENT } from '../utils/kenyaMarket.ts'
import {
  createKeCollectPayloadSchema,
  keCollectInstanceSchema,
  type CreateKeCollectPayload,
  type KeCollectInstance,
} from './keCollectSchemas.ts'

const COLLECTS_PATH = 'me/ke/collects'

function getKeCollectApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (responseData.code === 'payment_unavailable') {
      return 'Kenya KES collect is live-only. Switch the portal to Live and try again.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Kenya in Settings → Markets before creating M-Pesa collects.'
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
  return 'Unable to create the M-Pesa collect right now.'
}

export async function createKeCollect(
  payload: CreateKeCollectPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<KeCollectInstance> {
  try {
    const body = createKeCollectPayloadSchema.parse(payload)
    const response = await axiosInstance.post(COLLECTS_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(COLLECTS_PATH, body),
      }),
    })
    const created = keCollectInstanceSchema.parse(response.data)
    releaseIdempotencyKey(COLLECTS_PATH, body)
    return created
  } catch (error) {
    throw new Error(getKeCollectApiErrorMessage(error))
  }
}

export async function getKeCollect(
  transactionId: string,
): Promise<KeCollectInstance> {
  try {
    const response = await axiosInstance.get(
      `${COLLECTS_PATH}/${encodeURIComponent(transactionId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment: KENYA_LIVE_ONLY_ENVIRONMENT },
      },
    )
    return keCollectInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKeCollectApiErrorMessage(error))
  }
}
