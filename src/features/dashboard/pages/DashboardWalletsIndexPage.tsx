import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useMerchantWalletsQuery } from '../hooks/useMerchantWalletsQuery.ts'

export function DashboardWalletsIndexPage() {
  const navigate = useNavigate()
  const walletsQuery = useMerchantWalletsQuery(true)

  useEffect(() => {
    if (walletsQuery.isPending) {
      return
    }
    if (walletsQuery.isError || !walletsQuery.data?.items?.length) {
      void navigate({ to: '/dashboard', replace: true })
      return
    }
    const first = walletsQuery.data.items[0]
    void navigate({
      to: '/dashboard/wallets/$walletId',
      params: { walletId: first.id },
      replace: true,
    })
  }, [walletsQuery.isPending, walletsQuery.isError, walletsQuery.data, navigate])

  if (walletsQuery.isError || (!walletsQuery.isPending && !walletsQuery.data?.items?.length)) {
    return null
  }

  return (
    <section className="app-page-enter flex min-h-[240px] items-center justify-center">
      <LoadingSpinner label="Opening wallets..." />
    </section>
  )
}
