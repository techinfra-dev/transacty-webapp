import { useMutation } from '@tanstack/react-query'
import { login, signup } from '../services/authService.ts'
import { storeAuthSession } from '../services/authSession.ts'

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
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
