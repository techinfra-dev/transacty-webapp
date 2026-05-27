import { useQuery } from '@tanstack/react-query'
import { usePortalEnvironmentStore } from '../../../store/portalEnvironmentStore.ts'
import { listCustomers } from '../services/customersService.ts'

const MAX_CUSTOMERS_FOR_BALANCE = 500

export type CustomersBalanceByCurrency = {
  currency: string
  total: number
}

export function useCustomersTotalBalance(customerTotal: number, enabled = true) {
  const environment = usePortalEnvironmentStore((state) => state.environment)

  return useQuery({
    queryKey: ['customers-total-balance', environment, customerTotal],
    queryFn: async () => {
      if (customerTotal === 0) {
        return { byCurrency: [] as CustomersBalanceByCurrency[], isPartial: false }
      }

      const limit = Math.min(customerTotal, MAX_CUSTOMERS_FOR_BALANCE)
      const response = await listCustomers({ environment, limit, offset: 0 })
      const totals = new Map<string, number>()

      for (const customer of response.items) {
        const currency = customer.currency.trim().toUpperCase()
        const amount = Number(customer.balance)
        if (!Number.isFinite(amount)) {
          continue
        }
        totals.set(currency, (totals.get(currency) ?? 0) + amount)
      }

      const byCurrency = Array.from(totals.entries())
        .map(([currency, total]) => ({ currency, total }))
        .sort((left, right) => left.currency.localeCompare(right.currency))

      return {
        byCurrency,
        isPartial: customerTotal > limit,
      }
    },
    enabled: enabled && customerTotal >= 0,
    staleTime: 30_000,
  })
}
