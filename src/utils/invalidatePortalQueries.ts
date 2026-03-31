import type { QueryClient } from '@tanstack/react-query'

export function invalidatePortalQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['me-balance'] }),
    queryClient.invalidateQueries({ queryKey: ['customers-list'] }),
    queryClient.invalidateQueries({ queryKey: ['customer-detail'] }),
    queryClient.invalidateQueries({ queryKey: ['customer-transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions-list'] }),
    queryClient.invalidateQueries({ queryKey: ['transaction-detail'] }),
  ])
}
