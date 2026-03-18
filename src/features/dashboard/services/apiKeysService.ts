import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  createApiKeyPayloadSchema,
  createApiKeyResponseSchema,
  apiKeysResponseSchema,
  revokeApiKeyResponseSchema,
  type CreateApiKeyPayload,
  type CreateApiKeyResponse,
  type ApiKeysResponse,
  type RevokeApiKeyResponse,
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
  return 'Unable to complete API key request right now.'
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

export async function getApiKeys(): Promise<ApiKeysResponse> {
  try {
    const response = await axiosInstance.get('me/api-keys', {
      headers: getAuthHeader(),
    })

    return apiKeysResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}

export async function createApiKey(
  payload: CreateApiKeyPayload = {},
): Promise<CreateApiKeyResponse> {
  try {
    const validatedPayload = createApiKeyPayloadSchema.parse(payload)
    const response = await axiosInstance.post(
      'me/api-keys',
      { environment: validatedPayload.environment ?? 'test' },
      {
        headers: getAuthHeader(),
      },
    )
    return createApiKeyResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}

export async function revokeApiKey(keyId: string): Promise<RevokeApiKeyResponse> {
  try {
    const response = await axiosInstance.delete(`me/api-keys/${keyId}`, {
      headers: getAuthHeader(),
    })
    return revokeApiKeyResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}
