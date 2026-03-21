import { useMutation } from '@tanstack/react-query'
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
  verifyMfaLogin,
} from '../services/authService.ts'
import { storeAuthSession } from '../services/authSession.ts'
import type { LoginResponse } from '../services/authSchemas.ts'

function isSessionLoginResponse(
  data: LoginResponse,
): data is Extract<LoginResponse, { token: string }> {
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
      storeAuthSession(data)
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: forgotPassword,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  })
}
