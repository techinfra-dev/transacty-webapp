import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  webhookGetResponseSchema,
  webhookPatchRequestSchema,
  webhookPatchResponseSchema,
  type WebhookGetResponse,
  type WebhookPatchRequest,
  type WebhookPatchResponse,
} from './webhookSchemas.ts'

function getWebhookErrorMessage(error: unknown) {
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
  return 'Unable to complete webhook request right now.'
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

export async function getWebhook(): Promise<WebhookGetResponse> {
  try {
    const response = await axiosInstance.get('me/webhook', {
      headers: getAuthHeader(),
    })
    return webhookGetResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getWebhookErrorMessage(error))
  }
}

export async function patchWebhook(
  payload: WebhookPatchRequest,
): Promise<WebhookPatchResponse> {
  const body = webhookPatchRequestSchema.parse(payload)
  try {
    const response = await axiosInstance.patch('me/webhook', body, {
      headers: getAuthHeader(),
    })
    return webhookPatchResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getWebhookErrorMessage(error))
  }
}
