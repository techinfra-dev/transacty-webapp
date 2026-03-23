import { AxiosError } from 'axios'
import { z } from 'zod'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { apiErrorSchema } from '../../auth/services/authSchemas.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  mfaConfirmRequestSchema,
  mfaDisableRequestSchema,
  mfaSetupResponseSchema,
  mfaStatusResponseSchema,
  okResponseSchema,
  type MfaConfirmRequest,
  type MfaDisableRequest,
  type MfaSetupResponse,
  type MfaStatusResponse,
} from './mfaSchemas.ts'

function getAuthHeaders() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const parsed = apiErrorSchema.safeParse(error.response.data)
    if (parsed.success) {
      return parsed.data.message
    }
  }
  return 'Something went wrong. Please try again.'
}

export async function getMfaStatus(): Promise<MfaStatusResponse> {
  try {
    const response = await axiosInstance.get('me/mfa/status', {
      headers: getAuthHeaders(),
    })
    return mfaStatusResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function startMfaSetup(): Promise<MfaSetupResponse> {
  try {
    const response = await axiosInstance.post('me/mfa/setup', undefined, {
      headers: getAuthHeaders(),
    })
    return mfaSetupResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function confirmMfaSetup(payload: MfaConfirmRequest): Promise<void> {
  try {
    const validatedPayload = mfaConfirmRequestSchema.parse(payload)
    const response = await axiosInstance.post('me/mfa/confirm', validatedPayload, {
      headers: getAuthHeaders(),
    })
    okResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message ?? 'Please enter a valid 6-digit code.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}

export async function cancelMfaSetup(): Promise<void> {
  try {
    const response = await axiosInstance.post('me/mfa/cancel', undefined, {
      headers: getAuthHeaders(),
    })
    okResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function disableMfa(payload: MfaDisableRequest): Promise<void> {
  try {
    const validatedPayload = mfaDisableRequestSchema.parse(payload)
    const response = await axiosInstance.post('me/mfa/disable', validatedPayload, {
      headers: getAuthHeaders(),
    })
    okResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.issues[0]?.message ?? 'Please check your MFA details.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}
