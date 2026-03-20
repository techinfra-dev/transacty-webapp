import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  createPayoutPayloadSchema,
  createPayoutResponseSchema,
  type CreatePayoutPayload,
} from './payoutsSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

function getPayoutApiErrorMessage(error: unknown) {
  function normalizeMessage(rawMessage: string) {
    const trimmedMessage = rawMessage.trim()
    if (trimmedMessage.length === 0) {
      return ''
    }

    const withoutProviderName = trimmedMessage
      .replace(/payok account inquiry failed[:\s-]*/gi, '')
      .replace(/payok/gi, '')
      .trim()

    if (withoutProviderName.length === 0) {
      return 'Unable to create payout request right now.'
    }

    return withoutProviderName
  }

  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
    }
    if (
      typeof responseData.message === 'string' &&
      responseData.message.trim().length > 0
    ) {
      return normalizeMessage(responseData.message)
    }
    if (
      typeof responseData.error === 'string' &&
      responseData.error.trim().length > 0
    ) {
      return normalizeMessage(responseData.error)
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return normalizeMessage(error.message)
  }
  return 'Unable to create payout request right now.'
}

export async function createPayout(payload: CreatePayoutPayload) {
  try {
    const validatedPayload = createPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/payouts', validatedPayload, {
      headers: getAuthHeader(),
    })
    return createPayoutResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getPayoutApiErrorMessage(error))
  }
}
