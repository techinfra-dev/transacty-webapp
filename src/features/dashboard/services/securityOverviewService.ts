import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getPortalAuthHeaders } from '../../../api/portalAuthHeaders.ts'
import {
  securityOverviewResponseSchema,
  type SecurityOverviewResponse,
} from './securityOverviewSchemas.ts'

function getSecurityOverviewErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: unknown; error?: unknown }
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim()
    }
    if (typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error.trim()
    }
  }
  return 'Unable to load security overview right now.'
}

export async function getSecurityOverview(): Promise<SecurityOverviewResponse> {
  try {
    const response = await axiosInstance.get('me/security/overview', {
      headers: getPortalAuthHeaders(),
    })
    return securityOverviewResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getSecurityOverviewErrorMessage(error))
  }
}
