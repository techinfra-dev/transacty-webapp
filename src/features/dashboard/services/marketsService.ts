import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  portalMarketRowSchema,
  portalMarketsResponseSchema,
  type MerchantMarket,
  type PortalMarketRow,
} from './marketSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

function getMarketApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: unknown; error?: unknown }
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim()
    }
    if (typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error.trim()
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }
  return 'Unable to complete this market request right now.'
}

export async function getMarkets(): Promise<PortalMarketRow[]> {
  const response = await axiosInstance.get('me/markets', {
    headers: getAuthHeader(),
  })
  return portalMarketsResponseSchema.parse(response.data).items
}

export async function requestMarketActivation(
  market: MerchantMarket,
): Promise<PortalMarketRow> {
  try {
    const response = await axiosInstance.post(
      `me/markets/${market}/request`,
      {},
      { headers: getAuthHeader() },
    )
    return portalMarketRowSchema.parse(response.data)
  } catch (error) {
    throw new Error(getMarketApiErrorMessage(error))
  }
}
