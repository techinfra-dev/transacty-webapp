import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  portalServicesResponseSchema,
  type PortalServicesResponse,
} from './servicesSchemas.ts'

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

function getServicesApiErrorMessage(error: unknown) {
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
  return 'Unable to load services right now.'
}

export async function getPortalServices(
  environment: PortalEnvironment,
): Promise<PortalServicesResponse> {
  try {
    const response = await axiosInstance.get('me/services', {
      headers: getAuthHeader(),
      params: { environment },
    })
    return portalServicesResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getServicesApiErrorMessage(error))
  }
}
