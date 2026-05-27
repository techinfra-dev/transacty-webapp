import { Link, useParams } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Button } from '../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useUiPreferencesStore } from '../../../store/uiPreferencesStore.ts'
import { WalletActivityTable } from '../components/wallet/WalletActivityTable.tsx'
import { WalletOverviewCard } from '../components/wallet/WalletOverviewCard.tsx'
import { useMerchantWalletsQuery } from '../hooks/useMerchantWalletsQuery.ts'
import { useTransactionsListQuery } from '../hooks/useTransactionsQueries.ts'
import { getCurrencyFullName } from '../../../utils/currencyNames.ts'

const outlineBtn = 'dash-btn-outline'

export function DashboardWalletPage() {
  const { walletId } = useParams({ from: '/dashboard/wallets/$walletId' })
  const areBalancesHidden = useUiPreferencesStore(
    (state) => state.areBalancesHidden,
  )
  const toggleBalancesVisibility = useUiPreferencesStore(
    (state) => state.toggleBalancesVisibility,
  )

  const walletsQuery = useMerchantWalletsQuery(true)
  const transactionsQuery = useTransactionsListQuery({
    limit: 50,
    offset: 0,
  })

  const wallets = walletsQuery.data?.items ?? null
  const activeWallet = wallets?.find((w) => w.id === walletId) ?? null

  const pageSubtitle = useMemo(() => {
    if (!activeWallet) {
      return 'Manage balances, quick actions, and activity for each merchant pocket.'
    }
    return `${getCurrencyFullName(activeWallet.currency)} · ${activeWallet.currency} merchant pocket`
  }, [activeWallet])

  if (walletsQuery.isPending) {
    return (
      <section className="app-page-enter flex min-h-[240px] items-center justify-center">
        <LoadingSpinner label="Loading wallet..." />
      </section>
    )
  }

  if (walletsQuery.isError || wallets === null) {
    return (
      <section className="app-page-enter rounded-xl border border-rose-200 bg-rose-50 p-6">
        <p className="[font-family:var(--font-body)] text-sm text-rose-800">
          Unable to load wallets. Please try again from the dashboard.
        </p>
        <Link
          to="/dashboard"
          className="dash-btn-outline mt-4 inline-flex items-center rounded-lg px-3 [font-family:var(--font-body)] text-xs"
        >
          Back to dashboard
        </Link>
      </section>
    )
  }

  if (!activeWallet) {
    return (
      <section className="dashboard-card app-page-enter max-w-lg p-6">
        <h1 className="dash-page-title">Wallet not found</h1>
        <p className="dash-page-subtitle">
          This wallet is not available in the current environment, or the link may be outdated.
        </p>
        <Link
          to="/dashboard"
          className="dash-btn-outline mt-4 inline-flex items-center rounded-lg px-3 [font-family:var(--font-body)] text-[11.5px]"
        >
          Back to dashboard
        </Link>
      </section>
    )
  }

  return (
    <section className="app-page-enter flex flex-col gap-4">
      <header className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="dash-page-title">Wallets</h1>
          <p className="dash-page-subtitle">{pageSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            className={outlineBtn}
            onClick={() => walletsQuery.refetch()}
            disabled={walletsQuery.isRefetching}
          >
            {walletsQuery.isRefetching ? 'Refreshing...' : 'Refresh balances'}
          </Button>
          <Button variant="ghost" className={outlineBtn} onClick={toggleBalancesVisibility}>
            {areBalancesHidden ? 'Show balances' : 'Hide balances'}
          </Button>
        </div>
      </header>

      <WalletOverviewCard
        wallets={wallets}
        activeWalletId={activeWallet.id}
        areBalancesHidden={areBalancesHidden}
        walletsLoading={walletsQuery.isPending || walletsQuery.isRefetching}
      />

      <WalletActivityTable
        currency={activeWallet.currency}
        transactionsQuery={transactionsQuery}
      />
    </section>
  )
}
