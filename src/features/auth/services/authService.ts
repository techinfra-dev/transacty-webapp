import { AxiosError } from 'axios'
import { z } from 'zod'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  apiErrorSchema,
  authSessionResponseSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResponseSchema,
  getForgotPasswordFormErrorMessage,
  getLoginFormErrorMessage,
  getSignupFormErrorMessage,
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
  const parsed = loginRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(getLoginFormErrorMessage(payload, parsed.error))
  }
  try {
    const response = await axiosInstance.post('auth/login', parsed.data)
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
  const parsed = signupRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(getSignupFormErrorMessage(payload, parsed.error))
  }
  try {
    const response = await axiosInstance.post('auth/signup', parsed.data)
    return authSessionResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function forgotPassword(payload: ForgotPasswordRequest) {
  const parsed = forgotPasswordRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(getForgotPasswordFormErrorMessage(payload.email))
  }

  try {
    const response = await axiosInstance.post(
      'auth/forgot-password',
      parsed.data,
    )
    return forgotPasswordResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function resetPassword(payload: ResetPasswordRequest) {
  const parsed = resetPasswordRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.find((issue) => issue.path[0] === 'password')
        ?.message ?? 'Please enter a stronger password.',
    )
  }
  try {
    const response = await axiosInstance.post(
      'auth/reset-password',
      parsed.data,
    )
    return resetPasswordResponseSchema.parse(response.data)
  } catch (error) {
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
