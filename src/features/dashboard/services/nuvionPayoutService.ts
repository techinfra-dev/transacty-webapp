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
import { parsePayoutCreateResponse } from './payoutCreateResult.ts'
import type { PayoutCreateResult } from './payoutCreateResult.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  createNuvionPayoutPayloadSchema,
  nuvionPayoutInstanceSchema,
  type CreateNuvionPayoutPayload,
  type NuvionPayoutInstance,
} from './nuvionPayoutSchemas.ts'

const PAYOUTS_PATH = 'me/nuvion/payouts'

function getNuvionPayoutApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      merchantFacingError?: { message?: unknown }
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
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Unable to complete the Nuvion payout right now.'
}

export async function createNuvionPayout(
  payload: CreateNuvionPayoutPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<PayoutCreateResult<NuvionPayoutInstance>> {
  try {
    const body = createNuvionPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post(PAYOUTS_PATH, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(PAYOUTS_PATH, body),
      }),
    })
    const created = parsePayoutCreateResponse(
      response.data,
      nuvionPayoutInstanceSchema,
      response.status,
    )
    releaseIdempotencyKey(PAYOUTS_PATH, body)
    return created
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getNuvionPayoutApiErrorMessage(error))
  }
}

export async function getNuvionPayout(
  transactionId: string,
  environment: PortalEnvironment,
): Promise<NuvionPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `${PAYOUTS_PATH}/${encodeURIComponent(transactionId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment },
      },
    )
    return nuvionPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getNuvionPayoutApiErrorMessage(error))
  }
}
