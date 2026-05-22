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

const outlineBtn =
  'h-[34px]! min-h-0! border! border-solid! border-[#D4CFC4]! bg-white! px-2.5 text-[11.5px] font-semibold text-[#0F0700]! hover:bg-[#FAF8F4]!'

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
          className="mt-4 inline-flex h-9 items-center rounded-lg border border-[#D4CFC4] bg-white px-3 [font-family:var(--font-body)] text-xs font-semibold text-[#0F0700] transition hover:bg-[#FAF8F4]"
        >
          Back to dashboard
        </Link>
      </section>
    )
  }

  if (!activeWallet) {
    return (
      <section className="app-page-enter max-w-lg rounded-xl border border-[#E5E0D6] bg-white p-6">
        <h1 className="[font-family:var(--font-display)] text-[21px] font-semibold text-[#0F0700]">
          Wallet not found
        </h1>
        <p className="mt-2 [font-family:var(--font-body)] text-[12.5px] text-[#566167]">
          This wallet is not available in the current environment, or the link may be outdated.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex h-[34px] items-center rounded-lg border border-[#D4CFC4] bg-white px-3 [font-family:var(--font-body)] text-[11.5px] font-semibold text-[#0F0700] transition hover:bg-[#FAF8F4]"
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
          <h1 className="[font-family:var(--font-display)] text-[21px] font-semibold tracking-tight text-[#0F0700] md:text-[25px]">
            Wallets
          </h1>
          <p className="mt-1 max-w-xl [font-family:var(--font-body)] text-[12.5px] leading-relaxed text-[#566167]">
            {pageSubtitle}
          </p>
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
      />

      <WalletActivityTable
        currency={activeWallet.currency}
        transactionsQuery={transactionsQuery}
      />
    </section>
  )
}
