import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { markPayoutPinConfiguredInSession } from '../../auth/services/authSession.ts'
import { prepareAdminStepUp } from '../utils/prepareSensitiveMutation.ts'
import {
  changePayoutPin,
  getPayoutPinStatus,
  resetPayoutPin,
  setPayoutPin,
} from '../services/payoutPinService.ts'
import type {
  ChangePayoutPinRequest,
  ResetPayoutPinRequest,
  SetPayoutPinRequest,
} from '../services/payoutPinSchemas.ts'

export function usePayoutPinStatusQuery(enabled = true) {
  return useQuery({
    queryKey: ['payout-pin-status'],
    queryFn: getPayoutPinStatus,
    enabled,
    staleTime: 30_000,
  })
}

export function useSetPayoutPinMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SetPayoutPinRequest) => {
      const { stepUpToken } = await prepareAdminStepUp('payout_pin.write')
      return setPayoutPin(payload, stepUpToken)
    },
    onSuccess: async () => {
      markPayoutPinConfiguredInSession()
      await queryClient.invalidateQueries({ queryKey: ['payout-pin-status'] })
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}

export function useChangePayoutPinMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ChangePayoutPinRequest) => {
      const { stepUpToken } = await prepareAdminStepUp('payout_pin.write')
      return changePayoutPin(payload, stepUpToken)
    },
    onSuccess: async () => {
      markPayoutPinConfiguredInSession()
      await queryClient.invalidateQueries({ queryKey: ['payout-pin-status'] })
    },
  })
}

export function useResetPayoutPinMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ResetPayoutPinRequest) => {
      const { stepUpToken } = await prepareAdminStepUp('payout_pin.write')
      return resetPayoutPin(payload, stepUpToken)
    },
    onSuccess: async () => {
      markPayoutPinConfiguredInSession()
      await queryClient.invalidateQueries({ queryKey: ['payout-pin-status'] })
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}
