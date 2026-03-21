import { AxiosError } from 'axios'
import { z } from 'zod'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  apiErrorSchema,
  authSessionResponseSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  logoutResponseSchema,
  mfaVerifyRequestSchema,
  resetPasswordRequestSchema,
  resetPasswordResponseSchema,
  signupRequestSchema,
  type ForgotPasswordRequest,
  type LoginRequest,
  type LoginResponse,
  type MfaVerifyRequest,
  type ResetPasswordRequest,
  type SignupRequest,
} from './authSchemas.ts'
import { getAuthToken } from './authSession.ts'

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const parsed = apiErrorSchema.safeParse(error.response.data)
    if (parsed.success) {
      return parsed.data.message
    }
  }
  return 'Something went wrong. Please try again.'
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  try {
    const validatedPayload = loginRequestSchema.parse(payload)
    const response = await axiosInstance.post('auth/login', validatedPayload)
    return loginResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function verifyMfaLogin(payload: MfaVerifyRequest) {
  try {
    const validatedPayload = mfaVerifyRequestSchema.parse(payload)
    const response = await axiosInstance.post(
      'auth/mfa/verify',
      validatedPayload,
    )
    return authSessionResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Please enter a valid 6-digit code.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}

export async function signup(payload: SignupRequest) {
  try {
    const validatedPayload = signupRequestSchema.parse(payload)
    const response = await axiosInstance.post('auth/signup', validatedPayload)
    return authSessionResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Please check your input fields and try again.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}

export async function forgotPassword(payload: ForgotPasswordRequest) {
  try {
    const validatedPayload = forgotPasswordRequestSchema.parse(payload)
    const response = await axiosInstance.post(
      'auth/forgot-password',
      validatedPayload,
    )
    return forgotPasswordResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function resetPassword(payload: ResetPasswordRequest) {
  try {
    const validatedPayload = resetPasswordRequestSchema.parse(payload)
    const response = await axiosInstance.post(
      'auth/reset-password',
      validatedPayload,
    )
    return resetPasswordResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Please check your password and try again.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}

export async function logout() {
  try {
    const token = getAuthToken()
    const response = await axiosInstance.post(
      'auth/logout',
      undefined,
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    )
    return logoutResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
