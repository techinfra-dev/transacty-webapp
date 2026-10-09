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
import { CANADA_LIVE_ONLY_ENVIRONMENT } from '../utils/canadaMarket.ts'
import { assertNotPayoutPinError } from '../utils/payoutPinErrors.ts'
import { parsePayoutCreateResponse } from './payoutCreateResult.ts'
import type { PayoutCreateResult } from './payoutCreateResult.ts'
import {
  cadBankVerificationSchema,
  cadBillerSchema,
  cadBillsSearchResponseSchema,
  cadPayoutInstanceSchema,
  createCadPayoutPayloadSchema,
  verifyCadBankPayloadSchema,
  type CadBiller,
  type CadBankVerification,
  type CadPayoutInstance,
  type CreateCadPayoutPayload,
  type VerifyCadBankPayload,
} from './cadPayoutSchemas.ts'

const PAYOUTS_PATH = 'me/cad/payouts'

function getCadPayoutApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (responseData.code === 'payment_unavailable') {
      return 'Canada CAD payouts are live-only. Switch the portal to Live and try again.'
    }
    if (responseData.code === 'market_not_enabled') {
      return 'Enable Canada in Settings → Markets before sending CAD payouts.'
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
  return 'Unable to complete the CAD payout right now.'
}

export async function verifyCadBank(
  payload: VerifyCadBankPayload,
): Promise<CadBankVerification> {
  try {
    const body = verifyCadBankPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/cad/verify-bank', body, {
      headers: getPortalAuthHeaders(),
    })
    return cadBankVerificationSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCadPayoutApiErrorMessage(error))
  }
}

export async function searchCadBills(query: string): Promise<CadBiller[]> {
  try {
    const response = await axiosInstance.get('me/cad/bills/search', {
      headers: getPortalAuthHeaders(),
      params: {
        environment: CANADA_LIVE_ONLY_ENVIRONMENT,
        query: query.trim(),
      },
    })
    const parsed = cadBillsSearchResponseSchema.parse(response.data)
    return Array.isArray(parsed) ? parsed : parsed.items
  } catch (error) {
    throw new Error(getCadPayoutApiErrorMessage(error))
  }
}

export async function createCadPayout(
  payload: CreateCadPayoutPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<PayoutCreateResult<CadPayoutInstance>> {
  try {
    const body = createCadPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post(PAYOUTS_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(PAYOUTS_PATH, body),
      }),
    })
    const created = parsePayoutCreateResponse(
      response.data,
      cadPayoutInstanceSchema,
      response.status,
    )
    releaseIdempotencyKey(PAYOUTS_PATH, body)
    return created
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getCadPayoutApiErrorMessage(error))
  }
}

export async function getCadPayout(
  transactionId: string,
): Promise<CadPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `${PAYOUTS_PATH}/${encodeURIComponent(transactionId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment: CANADA_LIVE_ONLY_ENVIRONMENT },
      },
    )
    return cadPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCadPayoutApiErrorMessage(error))
  }
}

export { cadBillerSchema }
