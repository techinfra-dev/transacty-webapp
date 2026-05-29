import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useBalanceQuery } from '../hooks/useBalanceQuery.ts'

export function DashboardWalletsIndexPage() {
  const navigate = useNavigate()
  const balanceQuery = useBalanceQuery(true)

  useEffect(() => {
    if (balanceQuery.isPending) {
      return
    }
    if (balanceQuery.isError || !balanceQuery.data?.items?.length) {
      void navigate({ to: '/dashboard', replace: true })
      return
    }
    const first = balanceQuery.data.items[0]
    void navigate({
      to: '/dashboard/wallets/$walletId',
      params: { walletId: first.id },
      replace: true,
    })
  }, [balanceQuery.isPending, balanceQuery.isError, balanceQuery.data, navigate])

  if (balanceQuery.isError || (!balanceQuery.isPending && !balanceQuery.data?.items?.length)) {
    return null
  }

  return (
    <section className="app-page-enter flex min-h-[240px] items-center justify-center">
      <LoadingSpinner label="Opening wallets..." />
    </section>
  )
}
