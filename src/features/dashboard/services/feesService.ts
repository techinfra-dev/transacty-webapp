import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  merchantFeesResponseSchema,
  type MerchantFeesResponse,
} from './feesSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return { Authorization: `Bearer ${token}` }
}

function getFeesErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: unknown; error?: unknown }
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim()
    }
    if (typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error.trim()
    }
  }
  return 'Unable to load fee schedules right now.'
}

export async function getMerchantFees(
  environment: PortalEnvironment,
): Promise<MerchantFeesResponse> {
  try {
    const response = await axiosInstance.get('me/fees', {
      headers: getAuthHeader(),
      params: { environment },
    })
    return merchantFeesResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getFeesErrorMessage(error))
  }
}
