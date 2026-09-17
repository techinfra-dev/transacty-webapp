import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createNgnPayout,
  getNgnPayout,
  listNgnBanks,
  verifyNgnAccount,
} from '../services/ngnPayoutService.ts'
import type {
  CreateNgnPayoutPayload,
  VerifyNgnAccountPayload,
} from '../services/ngnPayoutSchemas.ts'
import { NIGERIA_LIVE_ONLY_ENVIRONMENT } from '../utils/nigeriaMarket.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
    queryClient.invalidateQueries({ queryKey: ['payout-approvals'] }),
  ])
}

export function useNgnBanksQuery(enabled = true) {
  return useQuery({
    queryKey: ['ngn-banks', NIGERIA_LIVE_ONLY_ENVIRONMENT],
    queryFn: () => listNgnBanks(),
    enabled,
    staleTime: 60 * 60 * 1000,
  })
}

export function useVerifyNgnAccountMutation() {
  return useMutation({
    mutationFn: (payload: Omit<VerifyNgnAccountPayload, 'environment'>) =>
      verifyNgnAccount({
        ...payload,
        environment: NIGERIA_LIVE_ONLY_ENVIRONMENT,
      }),
  })
}

export function useCreateNgnPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateNgnPayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createNgnPayout({ ...payload, pin }, { stepUpToken }),
        { description: 'Enter your payout PIN to send this NGN transfer.' },
      )
    },
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

const terminalNgnPayoutStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'canceled',
])

export function useNgnPayoutQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['ngn-payout', NIGERIA_LIVE_ONLY_ENVIRONMENT, transactionId],
    queryFn: () => getNgnPayout(transactionId!),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalNgnPayoutStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
