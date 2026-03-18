import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRefund,
  createTransfer,
  getTransaction,
  listTransactions,
} from '../services/transactionsService.ts'
import type {
  CreateRefundPayload,
  CreateTransferPayload,
  TransactionStatus,
  TransactionType,
} from '../services/transactionsSchemas.ts'

export function useTransactionsListQuery(params: {
  type?: TransactionType
  status?: TransactionStatus
  customerId?: string
  limit: number
  offset: number
}) {
  return useQuery({
    queryKey: ['transactions-list', params],
    queryFn: () => listTransactions(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useTransactionDetailQuery(
  transactionId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ['transaction-detail', transactionId],
    queryFn: () => getTransaction(transactionId as string),
    enabled: Boolean(transactionId) && enabled,
  })
}

export function useCreateTransferMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTransferPayload) => createTransfer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions-list'] })
    },
  })
}

export function useCreateRefundMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRefundPayload) => createRefund(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions-list'] })
    },
  })
}
