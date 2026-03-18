import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  apiKeysResponseSchema,
  type ApiKeysResponse,
} from './apiKeysSchemas.ts'

function getApiKeysErrorMessage(error: unknown) {
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
  return 'Unable to load API keys right now.'
}

export async function getApiKeys(): Promise<ApiKeysResponse> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  try {
    const response = await axiosInstance.get('me/api-keys', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return apiKeysResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}
