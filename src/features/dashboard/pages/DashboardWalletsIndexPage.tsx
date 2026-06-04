import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useBalanceQuery } from '../hooks/useBalanceQuery.ts'
import { getActivatedWallets } from '../utils/balanceWalletUtils.ts'

export function DashboardWalletsIndexPage() {
  const navigate = useNavigate()
  const balanceQuery = useBalanceQuery(true)
  const activatedWallets = getActivatedWallets(balanceQuery.data)

  useEffect(() => {
    if (balanceQuery.isPending) {
      return
    }
    if (balanceQuery.isError || activatedWallets.length === 0) {
      void navigate({ to: '/dashboard', replace: true })
      return
    }
    const first = activatedWallets[0]
    void navigate({
      to: '/dashboard/wallets/$walletId',
      params: { walletId: first.id },
      replace: true,
    })
  }, [balanceQuery.isPending, balanceQuery.isError, activatedWallets, navigate])

  if (
    balanceQuery.isError ||
    (!balanceQuery.isPending && activatedWallets.length === 0)
  ) {
    return null
  }

  return (
    <section className="app-page-enter flex min-h-[240px] items-center justify-center">
      <LoadingSpinner label="Opening wallets..." />
    </section>
  )
}
