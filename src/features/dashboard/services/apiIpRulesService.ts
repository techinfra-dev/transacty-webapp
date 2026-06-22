import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  apiIpRulesSchema,
  updateApiIpRulesPayloadSchema,
  type ApiIpRules,
  type UpdateApiIpRulesPayload,
} from './apiIpRulesSchemas.ts'

function getApiIpRulesErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
    }
    if (
      typeof responseData.message === 'string' &&
      responseData.message.trim().length > 0
    ) {
      return responseData.message
    }
    if (
      typeof responseData.error === 'string' &&
      responseData.error.trim().length > 0
    ) {
      return responseData.error
    }
  }
  return 'Unable to complete API IP allowlist request right now.'
}

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getApiIpRules(params: {
  environment: PortalEnvironment
}): Promise<ApiIpRules> {
  try {
    const response = await axiosInstance.get('me/api-ip-rules', {
      headers: getAuthHeader(),
      params: {
        environment: params.environment,
      },
    })
    return apiIpRulesSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiIpRulesErrorMessage(error))
  }
}

export async function updateApiIpRules(
  payload: UpdateApiIpRulesPayload,
): Promise<ApiIpRules> {
  const body = updateApiIpRulesPayloadSchema.parse(payload)
  try {
    const response = await axiosInstance.put('me/api-ip-rules', body, {
      headers: getAuthHeader(),
    })
    return apiIpRulesSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiIpRulesErrorMessage(error))
  }
}
