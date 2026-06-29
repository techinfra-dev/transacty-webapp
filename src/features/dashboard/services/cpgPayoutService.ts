import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  createCpgPayoutPayloadSchema,
  cpgPayoutInstanceSchema,
  type CreateCpgPayoutPayload,
  type CpgPayoutInstance,
} from './cpgPayoutSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

function createIdempotencyKey() {
  return crypto.randomUUID()
}

function getCpgPayoutApiErrorMessage(error: unknown) {
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
      return 'Enable India in Settings → Markets before sending USDT payouts.'
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Unable to complete USDT payout request right now.'
}

export async function createCpgPayout(
  payload: CreateCpgPayoutPayload,
): Promise<CpgPayoutInstance> {
  try {
    const body = createCpgPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/cpg/payout-requests', body, {
      headers: {
        ...getAuthHeader(),
        'Idempotency-Key': createIdempotencyKey(),
      },
    })
    return cpgPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCpgPayoutApiErrorMessage(error))
  }
}

export async function getCpgPayoutRequest(params: {
  transactionId: string
  environment: PortalEnvironment
}): Promise<CpgPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `me/cpg/payout-requests/${encodeURIComponent(params.transactionId)}`,
      {
        headers: getAuthHeader(),
        params: {
          environment: params.environment,
        },
      },
    )
    return cpgPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCpgPayoutApiErrorMessage(error))
  }
}
