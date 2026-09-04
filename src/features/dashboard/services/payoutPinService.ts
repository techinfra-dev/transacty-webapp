import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getPortalAuthHeaders } from '../../../api/portalAuthHeaders.ts'
import { parsePayoutPinError } from '../utils/payoutPinErrors.ts'
import {
  changePayoutPinRequestSchema,
  payoutPinOkResponseSchema,
  payoutPinStatusSchema,
  resetPayoutPinRequestSchema,
  setPayoutPinRequestSchema,
  type ChangePayoutPinRequest,
  type PayoutPinStatus,
  type ResetPayoutPinRequest,
  type SetPayoutPinRequest,
} from './payoutPinSchemas.ts'

const PAYOUT_PIN_PATH = 'me/payout-pin'

function getPayoutPinApiErrorMessage(error: unknown, fallback: string) {
  const pinError = parsePayoutPinError(error)
  if (pinError) {
    return pinError.message
  }
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: unknown; error?: unknown }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim()
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim()
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return fallback
}

export async function getPayoutPinStatus(): Promise<PayoutPinStatus> {
  try {
    const response = await axiosInstance.get(PAYOUT_PIN_PATH, {
      headers: getPortalAuthHeaders(),
    })
    return payoutPinStatusSchema.parse(response.data)
  } catch (error) {
    throw new Error(
      getPayoutPinApiErrorMessage(error, 'Unable to load payout PIN status.'),
    )
  }
}

/**
 * PIN values are passed straight through to the request body and never stored
 * — no caching, no logging, no idempotency hashing of the raw value.
 */
export async function setPayoutPin(
  payload: SetPayoutPinRequest,
  stepUpToken: string | undefined,
) {
  try {
    const body = setPayoutPinRequestSchema.parse(payload)
    const response = await axiosInstance.post(PAYOUT_PIN_PATH, body, {
      headers: getPortalAuthHeaders({ stepUpToken }),
    })
    return payoutPinOkResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(
      getPayoutPinApiErrorMessage(error, 'Unable to set the payout PIN.'),
    )
  }
}

export async function changePayoutPin(
  payload: ChangePayoutPinRequest,
  stepUpToken: string | undefined,
) {
  try {
    const body = changePayoutPinRequestSchema.parse(payload)
    const response = await axiosInstance.patch(PAYOUT_PIN_PATH, body, {
      headers: getPortalAuthHeaders({ stepUpToken }),
    })
    return payoutPinOkResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(
      getPayoutPinApiErrorMessage(error, 'Unable to change the payout PIN.'),
    )
  }
}

export async function resetPayoutPin(
  payload: ResetPayoutPinRequest,
  stepUpToken: string | undefined,
) {
  try {
    const body = resetPayoutPinRequestSchema.parse(payload)
    const response = await axiosInstance.post(
      `${PAYOUT_PIN_PATH}/reset`,
      body,
      { headers: getPortalAuthHeaders({ stepUpToken }) },
    )
    return payoutPinOkResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(
      getPayoutPinApiErrorMessage(error, 'Unable to reset the payout PIN.'),
    )
  }
}
