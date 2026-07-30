import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
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

export async function getApiKeys(): Promise<ApiKeysResponse> {
  try {
    const response = await axiosInstance.get('me/api-keys', {
      headers: getPortalAuthHeaders(),
    })

    return apiKeysResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}

export async function createApiKey(
  payload: CreateApiKeyPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<CreateApiKeyResponse> {
  try {
    const validatedPayload = createApiKeyPayloadSchema.parse(payload)
    const response = await axiosInstance.post(
      'me/api-keys',
      {
        environment: validatedPayload.environment,
        ...(validatedPayload.scopes && validatedPayload.scopes.length > 0
          ? { scopes: validatedPayload.scopes }
          : {}),
      },
      {
        headers: getPortalAuthHeaders(options),
      },
    )
    return createApiKeyResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}

export async function revokeApiKey(
  keyId: string,
  options: PortalRequestHeaderOptions = {},
): Promise<RevokeApiKeyResponse> {
  try {
    const response = await axiosInstance.delete(`me/api-keys/${keyId}`, {
      headers: getPortalAuthHeaders(options),
    })
    return revokeApiKeyResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiKeysErrorMessage(error))
  }
}
