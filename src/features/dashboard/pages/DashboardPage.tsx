import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner.tsx'
import { useUiPreferencesStore } from '../../../store/uiPreferencesStore.ts'
import { DashboardActivityPanel } from '../components/DashboardActivityPanel.tsx'
import { DashboardStatCard } from '../components/DashboardStatCard.tsx'
import { useBalanceQuery } from '../hooks/useBalanceQuery.ts'

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
  const balanceQuery = useBalanceQuery(true)

  const balanceData = balanceQuery.data
  const statCards = balanceData
    ? [
        {
          title: 'Total Balance',
          value: formatMoney(balanceData.currency, Number(balanceData.balance)),
          note: 'Overall wallet balance',
        },
        {
          title: 'Available Balance',
          value: formatMoney(
            balanceData.currency,
            Number(balanceData.availableBalance),
          ),
          note: 'Ready for payout',
        },
        {
          title: 'Pending Balance',
          value: formatMoney(
            balanceData.currency,
            Number(balanceData.pendingBalance),
          ),
          note: 'Awaiting settlement',
        },
        {
          title: 'Payout Limit (max)',
          value: formatMoney(balanceData.currency, balanceData.limits.payout.max),
          note: `Min ${formatMoney(balanceData.currency, balanceData.limits.payout.min)}`,
        },
      ]
    : []

  const outlineBtn =
    'h-10! border! border-solid! border-[#D4CFC4]! bg-white! px-3 text-xs font-semibold text-[#0F0700]! hover:bg-[#FAF8F4]!'

  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#0F0700] md:text-3xl">
            Merchant Insights Dashboard
          </h1>
          <p className="mt-1.5 max-w-xl [font-family:var(--font-body)] text-sm leading-relaxed text-[#566167]">
            Monitor transactions, customers, and payouts at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            className={outlineBtn}
            onClick={() => balanceQuery.refetch()}
            disabled={balanceQuery.isRefetching}
          >
            {balanceQuery.isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#566167]/35 border-t-[#566167]" />
                Refreshing...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0 text-[#566167]"
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
            className="h-10! border! border-solid! border-[#0F0700]! bg-[#0F0700]! px-3 text-xs font-semibold text-[#F3E8D6]! hover:bg-[#2a241c]!"
            onClick={() => navigate({ to: '/dashboard/payouts' })}
          >
            Request payout
          </Button>
        </div>
      </header>

      {balanceQuery.isPending ? (
        <section className="flex min-h-[160px] items-center justify-center rounded-xl border border-[#E5E0D6] bg-[#EFEBE3]">
          <LoadingSpinner label="Loading balances..." />
        </section>
      ) : balanceQuery.isError || !balanceData ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="[font-family:var(--font-body)] text-sm text-rose-700">
            Unable to load balances right now.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card, index) => {
            const icons = ['wallet', 'check', 'clock', 'bank'] as const
            return (
              <DashboardStatCard
                key={card.title}
                title={card.title}
                value={areBalancesHidden ? maskBalance(card.value) : card.value}
                note={card.note}
                icon={icons[index] ?? 'wallet'}
              />
            )
          })}
        </section>
      )}

      <section className="mt-8">
        <DashboardActivityPanel />
      </section>
    </>
  )
}
