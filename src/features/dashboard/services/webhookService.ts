import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
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

export async function getWebhook(): Promise<WebhookGetResponse> {
  try {
    const response = await axiosInstance.get('me/webhook', {
      headers: getPortalAuthHeaders(),
    })
    return webhookGetResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getWebhookErrorMessage(error))
  }
}

export async function patchWebhook(
  payload: WebhookPatchRequest,
  options: PortalRequestHeaderOptions = {},
): Promise<WebhookPatchResponse> {
  const body = webhookPatchRequestSchema.parse(payload)
  if (body.webhookUrl) {
    try {
      const parsedUrl = new URL(body.webhookUrl)
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Webhook URL must use HTTPS')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('HTTPS')) {
        throw error
      }
      throw new Error('Enter a valid HTTPS webhook URL.')
    }
  }
  try {
    const response = await axiosInstance.patch('me/webhook', body, {
      headers: getPortalAuthHeaders(options),
    })
    return webhookPatchResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getWebhookErrorMessage(error))
  }
}
