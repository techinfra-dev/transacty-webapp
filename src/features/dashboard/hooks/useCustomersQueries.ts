import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  getCustomer,
  listCustomerTransactions,
  listCustomers,
  updateCustomerStatus,
} from '../services/customersService.ts'
import type {
  CreateCustomerPayload,
  CustomerStatus,
  UpdateCustomerStatusPayload,
} from '../services/customersSchemas.ts'

export function useCustomersListQuery(params: {
  limit: number
  offset: number
  status?: CustomerStatus
}) {
  return useQuery({
    queryKey: ['customers-list', params],
    queryFn: () => listCustomers(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) => createCustomer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers-list'] })
    },
  })
}

export function useCustomerDetailQuery(customerId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['customer-detail', customerId],
    queryFn: () => getCustomer(customerId as string),
    enabled: Boolean(customerId) && enabled,
  })
}

export function useUpdateCustomerStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      customerId: string
      payload: UpdateCustomerStatusPayload
    }) => updateCustomerStatus(params),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers-list'] }),
        queryClient.invalidateQueries({
          queryKey: ['customer-detail', variables.customerId],
        }),
      ])
    },
  })
}

export function useCustomerTransactionsQuery(
  customerId: string | null,
  params: { limit: number; offset: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ['customer-transactions', customerId, params],
    queryFn: () =>
      listCustomerTransactions({
        customerId: customerId as string,
        limit: params.limit,
        offset: params.offset,
      }),
    enabled: Boolean(customerId) && enabled,
    placeholderData: (previousData) => previousData,
  })
}
