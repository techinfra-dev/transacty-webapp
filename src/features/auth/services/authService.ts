import { AxiosError } from 'axios'
import { z } from 'zod'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getPortalAuthHeaders } from '../../../api/portalAuthHeaders.ts'
import {
  apiErrorSchema,
  authSessionResponseSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResponseSchema,
  forgotPayoutPinRequestSchema,
  forgotPayoutPinResponseSchema,
  getForgotPasswordFormErrorMessage,
  getLoginFormErrorMessage,
  getSignupFormErrorMessage,
  loginRequestSchema,
  loginResponseSchema,
  logoutResponseSchema,
  mfaVerifyRequestSchema,
  resendVerificationRequestSchema,
  resendVerificationResponseSchema,
  resetPasswordRequestSchema,
  resetPasswordResponseSchema,
  revokeSessionsRequestSchema,
  revokeSessionsResponseSchema,
  signupRequestSchema,
  signupVerificationRequiredResponseSchema,
  stepUpRequestSchema,
  stepUpResponseSchema,
  verifyEmailRequestSchema,
  type ForgotPasswordRequest,
  type ForgotPayoutPinRequest,
  type LoginRequest,
  type LoginResponse,
  type MfaVerifyRequest,
  type ResendVerificationRequest,
  type ResetPasswordRequest,
  type RevokeSessionsRequest,
  type SignupRequest,
  type SignupResponse,
  type StepUpRequest,
  type VerifyEmailRequest,
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

export class EmailNotVerifiedError extends Error {
  readonly code = 'email_not_verified'
  readonly email: string

  constructor(message: string, email: string) {
    super(message)
    this.name = 'EmailNotVerifiedError'
    this.email = email
  }
}

function parseSignupResponse(data: unknown): SignupResponse {
  if (
    data &&
    typeof data === 'object' &&
    'emailVerificationRequired' in data &&
    (data as { emailVerificationRequired?: unknown }).emailVerificationRequired ===
      true
  ) {
    return signupVerificationRequiredResponseSchema.parse(data)
  }
  return authSessionResponseSchema.parse(data)
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
    if (error instanceof AxiosError && error.response?.status === 403) {
      const parsed = apiErrorSchema.safeParse(error.response.data)
      if (parsed.success && parsed.data.code === 'email_not_verified') {
        throw new EmailNotVerifiedError(parsed.data.message, payload.email)
      }
    }
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

export async function stepUp(payload: StepUpRequest) {
  const parsed = stepUpRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error('Enter a valid 6-digit code.')
  }
  try {
    const response = await axiosInstance.post('auth/step-up', parsed.data, {
      headers: getPortalAuthHeaders(),
    })
    return stepUpResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Unable to verify step-up response.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}

export async function revokeSessions(payload: RevokeSessionsRequest) {
  const parsed = revokeSessionsRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? 'Please enter your password.',
    )
  }
  try {
    const response = await axiosInstance.post(
      'auth/revoke-sessions',
      parsed.data,
      {
        headers: getPortalAuthHeaders(),
      },
    )
    return revokeSessionsResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const parsed = signupRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(getSignupFormErrorMessage(payload, parsed.error))
  }
  try {
    const response = await axiosInstance.post('auth/signup', parsed.data)
    return parseSignupResponse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function verifyEmail(payload: VerifyEmailRequest) {
  const parsed = verifyEmailRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? 'This verification link is invalid.',
    )
  }
  try {
    const response = await axiosInstance.post('auth/verify-email', parsed.data)
    return authSessionResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function resendVerification(payload: ResendVerificationRequest) {
  const parsed = resendVerificationRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(getForgotPasswordFormErrorMessage(payload.email))
  }
  try {
    const response = await axiosInstance.post(
      'auth/resend-verification',
      parsed.data,
    )
    return resendVerificationResponseSchema.parse(response.data)
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

export async function forgotPayoutPin(payload: ForgotPayoutPinRequest) {
  const parsed = forgotPayoutPinRequestSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(getForgotPasswordFormErrorMessage(payload.email))
  }

  try {
    const response = await axiosInstance.post(
      'auth/payout-pin/forgot',
      parsed.data,
    )
    return forgotPayoutPinResponseSchema.parse(response.data)
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
