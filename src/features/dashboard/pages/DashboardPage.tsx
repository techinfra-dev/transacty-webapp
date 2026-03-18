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

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
            Dashboard
          </h1>
          <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Monitor transactions, customers, and payouts at a glance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-10 border border-(--color-accent)/45 px-3 text-xs"
            onClick={() => balanceQuery.refetch()}
            disabled={balanceQuery.isRefetching}
          >
            {balanceQuery.isRefetching ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-secondary)/35 border-t-(--color-secondary)" />
                Refreshing...
              </span>
            ) : (
              'Refresh balances'
            )}
          </Button>
          <Button
            variant="ghost"
            className="h-10 border border-(--color-accent)/45 px-3 text-xs"
            onClick={toggleBalancesVisibility}
          >
            {areBalancesHidden ? 'Show balances' : 'Hide balances'}
          </Button>

          <Button className="h-10 px-3 text-xs">Request payout</Button>
        </div>
      </header>

      {balanceQuery.isPending ? (
        <section className="flex min-h-[160px] items-center justify-center rounded-xl border border-(--color-accent)/45 bg-(--color-card)">
          <LoadingSpinner label="Loading balances..." />
        </section>
      ) : balanceQuery.isError || !balanceData ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="[font-family:var(--font-body)] text-sm text-rose-700">
            Unable to load balances right now.
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          {statCards.map((card) => (
            <DashboardStatCard
              key={card.title}
              title={card.title}
              value={areBalancesHidden ? maskBalance(card.value) : card.value}
              note={card.note}
            />
          ))}
        </section>
      )}

      <section className="mt-6">
        <DashboardActivityPanel />
      </section>
    </>
  )
}
