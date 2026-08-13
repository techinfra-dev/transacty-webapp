import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  h2hBuyerConfirmPayloadSchema,
  h2hPayinCreatePayloadSchema,
  h2hPayinInstanceSchema,
  type H2hBuyerConfirmPayload,
  type H2hPayinCreatePayload,
  type H2hPayinInstance,
} from './h2hSchemas.ts'

function getH2hErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: unknown; error?: unknown }
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim()
    }
    if (typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error.trim()
    }
  }
  return 'Unable to complete India H2H request right now.'
}

export async function createH2hPayinInstance(
  payload: H2hPayinCreatePayload,
  options: PortalRequestHeaderOptions = {},
): Promise<H2hPayinInstance> {
  try {
    const body = h2hPayinCreatePayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/h2h/payin-instances', body, {
      headers: getPortalAuthHeaders(options),
    })
    return h2hPayinInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getH2hErrorMessage(error))
  }
}

export async function getH2hPayinInstance(
  transactionId: string,
  environment: PortalEnvironment,
): Promise<H2hPayinInstance> {
  try {
    const response = await axiosInstance.get(
      `me/h2h/payin-instances/${transactionId}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment },
      },
    )
    return h2hPayinInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getH2hErrorMessage(error))
  }
}

export async function confirmH2hBuyerPayment(
  payload: H2hBuyerConfirmPayload,
  options: PortalRequestHeaderOptions = {},
): Promise<H2hPayinInstance> {
  try {
    const body = h2hBuyerConfirmPayloadSchema.parse(payload)
    const response = await axiosInstance.post(
      'me/h2h/buyer-confirms-payment',
      body,
      { headers: getPortalAuthHeaders(options) },
    )
    return h2hPayinInstanceSchema.parse(response.data)
  } catch (error) {
    throw new Error(getH2hErrorMessage(error))
  }
}
