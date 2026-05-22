import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { useUiPreferencesStore } from '../../../store/uiPreferencesStore.ts'
import { DashboardActivityPanel } from '../components/DashboardActivityPanel.tsx'
import { DashboardWalletDistributionChart } from '../components/DashboardWalletDistributionChart.tsx'
import { DashboardAddWalletCard } from '../components/DashboardAddWalletCard.tsx'
import { DashboardWalletCard } from '../components/DashboardWalletCard.tsx'
import { DashboardWalletsSkeleton } from '../components/DashboardWalletsSkeleton.tsx'
import { useMerchantWalletsQuery } from '../hooks/useMerchantWalletsQuery.ts'
import { useProfileQuery } from '../hooks/useProfileQuery.ts'

function MerchantKycBadge({
  kycStatus,
}: {
  kycStatus: 'pending' | 'verified' | 'rejected' | undefined
}) {
  const base =
    'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-[10.5px] font-semibold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2 motion-safe:duration-300'
  if (kycStatus === undefined) {
    return (
      <span
        className={`${base} bg-[#E8E4DE] text-[#566167]`}
        aria-hidden
      >
        …
      </span>
    )
  }
  if (kycStatus === 'verified') {
    return (
      <span className={`${base} bg-[#3D6B4F] text-white`}>
        Verified merchant
      </span>
    )
  }
  const label = kycStatus === 'pending' ? 'KYC pending' : 'KYC rejected'
  return <span className={`${base} bg-[#9D8F82] text-white`}>{label}</span>
}

function formatMoney(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function maskBalance(formattedMoney: string) {
  const [currency] = formattedMoney.split(' ')
  return `${currency} ******`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const areBalancesHidden = useUiPreferencesStore(
    (state) => state.areBalancesHidden,
  )
  const toggleBalancesVisibility = useUiPreferencesStore(
    (state) => state.toggleBalancesVisibility,
  )
  const walletsQuery = useMerchantWalletsQuery(true)
  const profileQuery = useProfileQuery(true)

  const wallets = walletsQuery.data?.items ?? null

  const outlineBtn =
    'h-[34px]! min-h-0! border! border-solid! border-[#D4CFC4]! bg-white! px-2.5 text-[11.5px] font-semibold text-[#0F0700]! hover:bg-[#FAF8F4]!'

  return (
    <>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="[font-family:var(--font-display)] text-[21px] font-semibold tracking-tight text-[#0F0700] md:text-[25px]">
              Merchant Insights Dashboard
            </h1>
            <MerchantKycBadge kycStatus={profileQuery.data?.kycStatus} />
          </div>
          <p className="mt-1 max-w-xl [font-family:var(--font-body)] text-[12.5px] leading-relaxed text-[#566167]">
            Monitor transactions, customers, and payouts at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="ghost"
            className={outlineBtn}
            onClick={() => walletsQuery.refetch()}
            disabled={walletsQuery.isRefetching}
          >
            {walletsQuery.isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#566167]/35 border-t-[#566167]" />
                Refreshing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 shrink-0 text-[#566167]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh balances
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={outlineBtn}
            onClick={toggleBalancesVisibility}
          >
            {areBalancesHidden ? 'Show balances' : 'Hide balances'}
          </Button>

          <Button
            className="h-[34px]! min-h-0! border! border-solid! border-[#0F0700]! bg-[#0F0700]! px-2.5 text-[11.5px] font-semibold text-[#F3E8D6]! hover:bg-[#2a241c]!"
            onClick={() => navigate({ to: '/dashboard/payouts' })}
          >
            Request payout
          </Button>
        </div>
      </header>

      {walletsQuery.isPending ? (
        <DashboardWalletsSkeleton />
      ) : walletsQuery.isError || wallets === null ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="[font-family:var(--font-body)] text-sm text-rose-700">
            Unable to load merchant wallets right now.
          </p>
        </section>
      ) : wallets.length === 0 ? (
        <section className="rounded-xl border border-[#E5E0D6] bg-[#EFEBE3] p-4">
          <p className="[font-family:var(--font-body)] text-sm text-[#566167]">
            No active merchant wallets for this environment.
          </p>
        </section>
      ) : (
        <section className="dashboard-wallets-grid">
          {wallets.map((wallet) => {
            const amount = Number(wallet.balance)
            const safeAmount = Number.isFinite(amount) ? amount : 0
            const formatted = formatMoney(wallet.currency, safeAmount)
            return (
              <DashboardWalletCard
                key={wallet.id}
                walletId={wallet.id}
                currency={wallet.currency}
                displayValue={
                  areBalancesHidden ? maskBalance(formatted) : formatted
                }
                statusLabel={wallet.status}
              />
            )
          })}
          <DashboardAddWalletCard />
        </section>
      )}

      <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:items-start">
        <DashboardActivityPanel />
        <DashboardWalletDistributionChart />
      </section>
    </>
  )
}
