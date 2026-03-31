import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
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
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['customers-list', environment, params],
    queryFn: () => listCustomers({ ...params, environment }),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<CreateCustomerPayload, 'environment'>) =>
      createCustomer({
        ...payload,
        environment: usePortalEnvironmentStore.getState().environment,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customers-list'] })
    },
  })
}

export function useCustomerDetailQuery(customerId: string | null, enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['customer-detail', environment, customerId],
    queryFn: () => getCustomer(customerId as string, environment),
    enabled: Boolean(customerId) && enabled,
  })
}

export function useUpdateCustomerStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      customerId: string
      payload: UpdateCustomerStatusPayload
    }) =>
      updateCustomerStatus({
        customerId: params.customerId,
        environment: usePortalEnvironmentStore.getState().environment,
        payload: params.payload,
      }),
    onSuccess: async (_data, variables) => {
      const environment = usePortalEnvironmentStore.getState().environment
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customers-list'] }),
        queryClient.invalidateQueries({
          queryKey: ['customer-detail', environment, variables.customerId],
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
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['customer-transactions', environment, customerId, params],
    queryFn: () =>
      listCustomerTransactions({
        customerId: customerId as string,
        environment,
        limit: params.limit,
        offset: params.offset,
      }),
    enabled: Boolean(customerId) && enabled,
    placeholderData: (previousData) => previousData,
  })
}
