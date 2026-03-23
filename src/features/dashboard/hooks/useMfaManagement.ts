import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelMfaSetup,
  confirmMfaSetup,
  disableMfa,
  getMfaStatus,
  startMfaSetup,
} from '../services/mfaService.ts'
import type {
  MfaConfirmRequest,
  MfaDisableRequest,
} from '../services/mfaSchemas.ts'

const MFA_STATUS_QUERY_KEY = ['mfa-status']

export function useMfaStatusQuery(enabled = true) {
  return useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
    queryFn: getMfaStatus,
    enabled,
    staleTime: 30_000,
  })
}

export function useStartMfaSetupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: startMfaSetup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}

export function useConfirmMfaSetupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MfaConfirmRequest) => confirmMfaSetup(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}

export function useCancelMfaSetupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelMfaSetup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}

export function useDisableMfaMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MfaDisableRequest) => disableMfa(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}
