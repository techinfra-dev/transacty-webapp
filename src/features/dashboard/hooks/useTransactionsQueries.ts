import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import {
  createRefund,
  createTransfer,
  getTransaction,
  listTransactions,
} from '../services/transactionsService.ts'
import type {
  CreateRefundPayload,
  CreateTransferPayload,
  TransactionRailApi,
  TransactionStatus,
  TransactionType,
} from '../services/transactionsSchemas.ts'

export function useTransactionsListQuery(
  params: {
    type?: TransactionType
    status?: TransactionStatus
    customerId?: string
    rail?: TransactionRailApi
    limit: number
    offset: number
  },
  options?: { enabled?: boolean },
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  const { type, status, customerId, rail, limit, offset } = params

  return useQuery({
    queryKey: [
      'transactions-list',
      environment,
      limit,
      offset,
      type ?? null,
      status ?? null,
      customerId ?? null,
      rail ?? null,
    ],
    queryFn: () =>
      listTransactions({
        environment,
        type,
        status,
        customerId,
        rail,
        limit,
        offset,
      }),
    enabled: options?.enabled ?? true,
  })
}

export function useTransactionDetailQuery(
  transactionId: string | null,
  enabled = true,
) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['transaction-detail', environment, transactionId],
    queryFn: () => getTransaction(transactionId as string, environment),
    enabled: Boolean(transactionId) && enabled,
  })
}

export function useCreateTransferMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CreateTransferPayload, 'environment'>) =>
      createTransfer({
        ...payload,
        environment: usePortalEnvironmentStore.getState().environment,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}

export function useCreateRefundMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CreateRefundPayload, 'environment'>) =>
      createRefund({
        ...payload,
        environment: usePortalEnvironmentStore.getState().environment,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
        queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-wallets'] }),
      ])
    },
  })
}
