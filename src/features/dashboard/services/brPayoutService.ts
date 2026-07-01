import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  createBrPayoutPayloadSchema,
  createBrPayoutResponseSchema,
  type CreateBrPayoutPayload,
} from './brPayoutSchemas.ts'

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

export async function createBrPayout(payload: CreateBrPayoutPayload) {
  try {
    const validatedPayload = createBrPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/br/payouts', validatedPayload, {
      headers: {
        ...getAuthHeader(),
        'Idempotency-Key': createIdempotencyKey(),
      },
    })
    return createBrPayoutResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getBrPayoutApiErrorMessage(error))
  }
}
