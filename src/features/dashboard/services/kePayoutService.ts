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
import { parsePayoutCreateResponse } from './payoutCreateResult.ts'
import type { PayoutCreateResult } from './payoutCreateResult.ts'
import {
  createKePayoutPayloadSchema,
  kePayoutFeeQuoteSchema,
  kePayoutInstanceSchema,
  type CreateKePayoutPayload,
  type KePayoutFeeQuote,
  type KePayoutInstance,
} from './kePayoutSchemas.ts'

const PAYOUTS_PATH = 'me/ke/payouts'

function getKePayoutApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (responseData.code === 'payment_unavailable') {
      return 'Kenya KES payouts are live-only. Switch the portal to Live and try again.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Kenya in Settings → Markets before sending KES payouts.'
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
  return 'Unable to complete the KES payout right now.'
}

export async function getKePayoutFeeQuote(amount: string): Promise<KePayoutFeeQuote> {
  try {
    const response = await axiosInstance.get(`${PAYOUTS_PATH}/fee-quote`, {
      headers: getPortalAuthHeaders(),
      params: {
        amount: amount.trim(),
        environment: KENYA_LIVE_ONLY_ENVIRONMENT,
      },
    })
    return kePayoutFeeQuoteSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKePayoutApiErrorMessage(error))
  }
}

export async function createKePayout(
  payload: CreateKePayoutPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<PayoutCreateResult<KePayoutInstance>> {
  try {
    const body = createKePayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post(PAYOUTS_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(PAYOUTS_PATH, body),
      }),
    })
    const created = parsePayoutCreateResponse(
      response.data,
      kePayoutInstanceSchema,
      response.status,
    )
    releaseIdempotencyKey(PAYOUTS_PATH, body)
    return created
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getKePayoutApiErrorMessage(error))
  }
}

export async function getKePayout(
  transactionId: string,
): Promise<KePayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `${PAYOUTS_PATH}/${encodeURIComponent(transactionId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment: KENYA_LIVE_ONLY_ENVIRONMENT },
      },
    )
    return kePayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKePayoutApiErrorMessage(error))
  }
}
