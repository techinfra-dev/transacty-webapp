import { useMutation } from '@tanstack/react-query'
import {
  forgotPassword,
  forgotPayoutPin,
  login,
  resendVerification,
  resetPassword,
  revokeSessions,
  signup,
  stepUp,
  verifyEmail,
  verifyMfaLogin,
} from '../services/authService.ts'
import { storeAuthSession } from '../services/authSession.ts'
import type { LoginResponse, SignupResponse } from '../services/authSchemas.ts'

function isSessionLoginResponse(
  data: LoginResponse,
): data is Extract<LoginResponse, { token: string }> {
  return 'token' in data && Boolean(data.token)
}

function isSignupSessionResponse(
  data: SignupResponse,
): data is Extract<SignupResponse, { token: string }> {
  return 'token' in data && Boolean(data.token)
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if (isSessionLoginResponse(data)) {
        storeAuthSession(data)
      }
    },
  })
}

export function useMfaVerifyMutation() {
  return useMutation({
    mutationFn: verifyMfaLogin,
    onSuccess: (data) => {
      storeAuthSession(data)
    },
  })
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      if (isSignupSessionResponse(data)) {
        storeAuthSession(data)
      }
    },
  })
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: (data) => {
      storeAuthSession(data)
    },
  })
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: resendVerification,
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPassword,
  })
}

export function useForgotPayoutPinMutation() {
  return useMutation({
    mutationFn: forgotPayoutPin,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  })
}

export function useStepUpMutation() {
  return useMutation({
    mutationFn: stepUp,
  })
}

export function useRevokeSessionsMutation() {
  return useMutation({
    mutationFn: revokeSessions,
  })
}
