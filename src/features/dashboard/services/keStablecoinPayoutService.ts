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
import { assertNotPayoutPinError } from '../utils/payoutPinErrors.ts'
import {
  createKeStablecoinPayoutPayloadSchema,
  createKeStablecoinQuotePayloadSchema,
  keStablecoinPayoutInstanceSchema,
  keStablecoinQuoteSchema,
  type CreateKeStablecoinPayoutPayload,
  type CreateKeStablecoinQuotePayload,
  type KeStablecoinPayoutInstance,
  type KeStablecoinQuote,
} from './keStablecoinPayoutSchemas.ts'

const STABLECOIN_PATH = 'me/ke/payouts/stablecoin'

function getKeStablecoinApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
      merchantFacingError?: { message?: unknown }
    }
    if (responseData.code === 'payment_unavailable') {
      return 'Kenya stablecoin payouts are live-only. Switch the portal to Live and try again.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Kenya in Settings → Markets before sending KES payouts.'
    }
    const merchantMessage = responseData.merchantFacingError?.message
    if (typeof merchantMessage === 'string' && merchantMessage.trim()) {
      return merchantMessage.trim()
    }
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message.trim()
    }
    if (typeof responseData.error === 'string' && responseData.error.trim()) {
      return responseData.error.trim()
    }
    if (error.response.status === 400) {
      return 'This quote expired or was already used. Get a fresh quote and try again.'
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Unable to complete the KES stablecoin payout right now.'
}

export async function createKeStablecoinQuote(
  payload: CreateKeStablecoinQuotePayload,
): Promise<KeStablecoinQuote> {
  try {
    const body = createKeStablecoinQuotePayloadSchema.parse(payload)
    const response = await axiosInstance.post(`${STABLECOIN_PATH}/quote`, body, {
      headers: getPortalAuthHeaders(),
      params: { environment: KENYA_LIVE_ONLY_ENVIRONMENT },
    })
    return keStablecoinQuoteSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKeStablecoinApiErrorMessage(error))
  }
}

export async function createKeStablecoinPayout(
  payload: CreateKeStablecoinPayoutPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<KeStablecoinPayoutInstance> {
  try {
    const body = createKeStablecoinPayoutPayloadSchema.parse({
      ...payload,
      environment: payload.environment ?? KENYA_LIVE_ONLY_ENVIRONMENT,
    })
    const response = await axiosInstance.post(STABLECOIN_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(STABLECOIN_PATH, body),
      }),
    })
    const created = keStablecoinPayoutInstanceSchema.parse(response.data)
    releaseIdempotencyKey(STABLECOIN_PATH, body)
    return created
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getKeStablecoinApiErrorMessage(error))
  }
}

export async function getKeStablecoinPayout(
  transactionId: string,
): Promise<KeStablecoinPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `${STABLECOIN_PATH}/${encodeURIComponent(transactionId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment: KENYA_LIVE_ONLY_ENVIRONMENT },
      },
    )
    return keStablecoinPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKeStablecoinApiErrorMessage(error))
  }
}
