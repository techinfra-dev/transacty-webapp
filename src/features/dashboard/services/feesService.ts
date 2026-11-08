import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  feeScheduleItemSchema,
  merchantFeesResponseSchema,
  type FeeScheduleItem,
  type MerchantFeesResponse,
} from './feesSchemas.ts'

const EMPTY_FEES_RESPONSE: MerchantFeesResponse = {
  items: [],
  schedules: [],
}

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return { Authorization: `Bearer ${token}` }
}

function toEmptyFeesResponse(
  environment: PortalEnvironment,
  note?: string,
): MerchantFeesResponse {
  return {
    ...EMPTY_FEES_RESPONSE,
    environment,
    ...(note ? { note } : {}),
  }
}

function isNoFeesConfiguredError(error: unknown) {
  if (!(error instanceof AxiosError) || !error.response) {
    return false
  }

  const status = error.response.status
  if (status === 404 || status === 204) {
    return true
  }

  const data = error.response.data as {
    message?: unknown
    error?: unknown
    code?: unknown
  }
  const message = [
    typeof data.message === 'string' ? data.message : '',
    typeof data.error === 'string' ? data.error : '',
    typeof data.code === 'string' ? data.code : '',
  ]
    .join(' ')
    .toLowerCase()

  return (
    /no[_ ]?fee/.test(message) ||
    /fee.*not (found|configured|available)/.test(message) ||
    /not configured/.test(message) ||
    /no schedules?/.test(message) ||
    /payment_unavailable/.test(message)
  )
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

function readOptionalNote(data: unknown) {
  if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    typeof (data as { note?: unknown }).note === 'string'
  ) {
    return (data as { note: string }).note
  }
  return undefined
}

function isEmptyFeesPayload(data: unknown) {
  if (data == null || data === '') {
    return true
  }
  if (Array.isArray(data)) {
    return data.length === 0
  }
  if (typeof data !== 'object') {
    return false
  }

  const record = data as Record<string, unknown>
  const items = record.items
  const schedules = record.schedules

  const itemsEmpty = items == null || (Array.isArray(items) && items.length === 0)
  const schedulesEmpty =
    schedules == null || (Array.isArray(schedules) && schedules.length === 0)

  return itemsEmpty && schedulesEmpty
}

function parseFeeItems(data: unknown): FeeScheduleItem[] {
  if (!Array.isArray(data)) {
    return []
  }
  return data.flatMap((item) => {
    const parsed = feeScheduleItemSchema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  })
}

export async function getMerchantFees(
  environment: PortalEnvironment,
): Promise<MerchantFeesResponse> {
  try {
    const response = await axiosInstance.get('me/fees', {
      headers: getAuthHeader(),
      params: { environment },
    })

    if (response.status === 204 || isEmptyFeesPayload(response.data)) {
      return toEmptyFeesResponse(environment, readOptionalNote(response.data))
    }

    if (Array.isArray(response.data)) {
      const items = parseFeeItems(response.data)
      if (items.length === 0) {
        return toEmptyFeesResponse(environment)
      }
      return { environment, items, schedules: items }
    }

    const parsed = merchantFeesResponseSchema.safeParse(response.data)
    if (!parsed.success) {
      if (isEmptyFeesPayload(response.data)) {
        return toEmptyFeesResponse(environment, readOptionalNote(response.data))
      }
      throw new Error('Unable to load fee schedules right now.')
    }

    const items = parsed.data.items ?? parsed.data.schedules ?? []
    if (items.length === 0) {
      return toEmptyFeesResponse(environment, parsed.data.note)
    }

    return parsed.data
  } catch (error) {
    if (isNoFeesConfiguredError(error)) {
      return toEmptyFeesResponse(environment)
    }
    throw new Error(getFeesErrorMessage(error))
  }
}
