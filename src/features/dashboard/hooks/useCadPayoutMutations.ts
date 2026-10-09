import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCadPayout,
  getCadPayout,
  searchCadBills,
  verifyCadBank,
} from '../services/cadPayoutService.ts'
import type {
  CreateCadPayoutPayload,
  VerifyCadBankPayload,
} from '../services/cadPayoutSchemas.ts'
import { CANADA_LIVE_ONLY_ENVIRONMENT } from '../utils/canadaMarket.ts'
import { runPayoutWrite } from '../utils/prepareSensitiveMutation.ts'

function invalidatePayoutQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
    queryClient.invalidateQueries({ queryKey: ['payout-approvals'] }),
  ])
}

export function useCadBillSearchQuery(query: string, enabled = true) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['cad-bills-search', CANADA_LIVE_ONLY_ENVIRONMENT, trimmed],
    queryFn: () => searchCadBills(trimmed),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 30_000,
  })
}

export function useVerifyCadBankMutation() {
  return useMutation({
    mutationFn: (payload: Omit<VerifyCadBankPayload, 'environment'>) =>
      verifyCadBank({
        ...payload,
        environment: CANADA_LIVE_ONLY_ENVIRONMENT,
      }),
  })
}

export function useCreateCadPayoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateCadPayoutPayload) => {
      return runPayoutWrite(
        ({ stepUpToken, pin }) =>
          createCadPayout({ ...payload, pin }, { stepUpToken }),
        { description: 'Enter your payout PIN to send this CAD transfer.' },
      )
    },
    onSuccess: async () => {
      await invalidatePayoutQueries(queryClient)
    },
  })
}

const terminalCadPayoutStatuses = new Set([
  'success',
  'failed',
  'cancelled',
  'canceled',
  'settled',
])

export function useCadPayoutQuery(
  transactionId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['cad-payout', CANADA_LIVE_ONLY_ENVIRONMENT, transactionId],
    queryFn: () => getCadPayout(transactionId!),
    enabled: enabled && Boolean(transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status?.trim().toLowerCase()
      if (status && terminalCadPayoutStatuses.has(status)) {
        return false
      }
      return 5_000
    },
  })
}
