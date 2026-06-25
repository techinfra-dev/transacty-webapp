import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  createEurPayoutPayloadSchema,
  eurPayoutInstanceSchema,
  type CreateEurPayoutPayload,
  type EurPayoutInstance,
} from './eurPayoutSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

function getEurPayoutApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
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
  return 'Unable to complete EUR payout request right now.'
}

export async function createEurPayout(
  payload: CreateEurPayoutPayload,
): Promise<EurPayoutInstance> {
  try {
    const body = createEurPayoutPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/eur/payout-instances', body, {
      headers: getAuthHeader(),
    })
    return eurPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getEurPayoutApiErrorMessage(error))
  }
}

export async function approveEurPayout(params: {
  transactionId: string
  environment: PortalEnvironment
}): Promise<EurPayoutInstance> {
  try {
    const response = await axiosInstance.post(
      `me/eur/payout-instances/${encodeURIComponent(params.transactionId)}/approve`,
      {},
      {
        headers: getAuthHeader(),
        params: {
          environment: params.environment,
        },
      },
    )
    return eurPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getEurPayoutApiErrorMessage(error))
  }
}

export async function getEurPayoutInstance(params: {
  transactionId: string
  environment: PortalEnvironment
}): Promise<EurPayoutInstance> {
  try {
    const response = await axiosInstance.get(
      `me/eur/payout-instances/${encodeURIComponent(params.transactionId)}`,
      {
        headers: getAuthHeader(),
        params: {
          environment: params.environment,
        },
      },
    )
    return eurPayoutInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getEurPayoutApiErrorMessage(error))
  }
}
