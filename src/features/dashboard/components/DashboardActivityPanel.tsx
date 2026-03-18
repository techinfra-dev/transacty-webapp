interface ActivityItem {
  id: string
  type: string
  counterparty: string
  currency: string
  direction: 'inflow' | 'outflow'
  date: string
  time: string
  amount: string
  fee: string
  balance: string
  status: 'Successful' | 'Pending' | 'Failed'
}

const activities: ActivityItem[] = [
  {
    id: 'TRX-18472',
    type: 'Bank Transfer Direct Deposit',
    counterparty: 'From: Green Ventures Ltd.',
    currency: 'BDT',
    direction: 'inflow',
    date: 'Mar 11, 2026',
    time: '03:04 PM',
    amount: '+BDT 200.00',
    fee: 'BDT 1.00',
    balance: 'BDT 905.76',
    status: 'Successful',
  },
  {
    id: 'TRX-18458',
    type: 'Withdrawal',
    counterparty: 'To: Olivia Stone',
    currency: 'BDT',
    direction: 'outflow',
    date: 'Mar 10, 2026',
    time: '01:59 PM',
    amount: '-BDT 200.00',
    fee: 'BDT 10.00',
    balance: 'BDT 717.14',
    status: 'Pending',
  },
  {
    id: 'TRX-18416',
    type: 'Bank Transfer Direct Deposit',
    counterparty: 'From: Daniel Adeola',
    currency: 'BDT',
    direction: 'inflow',
    date: 'Mar 09, 2026',
    time: '11:28 AM',
    amount: '+BDT 100.00',
    fee: 'BDT 0.50',
    balance: 'BDT 1,147.44',
    status: 'Successful',
  },
]

function statusClassName(status: ActivityItem['status']) {
  if (status === 'Successful') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'Pending') {
    return 'bg-amber-100 text-amber-700'
  }
  return 'bg-rose-100 text-rose-700'
}

function directionAccentClass(direction: ActivityItem['direction']) {
  return direction === 'inflow'
    ? 'bg-emerald-500/14 text-emerald-700'
    : 'bg-rose-500/14 text-rose-700'
}

function activityMethodLabel(type: ActivityItem['type']) {
  if (type.toLowerCase().includes('withdrawal')) {
    return 'Withdrawal'
  }
  return 'Bank Transfer'
}

function activityCustomerLabel(counterparty: ActivityItem['counterparty']) {
  return counterparty.replace(/^From:\s*|^To:\s*/i, '')
}

export function DashboardActivityPanel() {
  const displayedActivities = activities.slice(0, 10)

  return (
    <section className="rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
          Recent activity
        </h2>
        <button
          type="button"
          className="[font-family:var(--font-body)] text-sm font-semibold text-(--color-secondary) hover:text-(--color-foreground)"
        >
          View all
        </button>
      </div>

      <div className="hidden grid-cols-[132px_1.8fr_124px_108px_124px_108px_138px] gap-3 border-b border-(--color-accent)/35 px-5 py-3 [font-family:var(--font-body)] text-[11px] font-semibold uppercase tracking-wide text-(--color-secondary) lg:grid">
        <p>Transaction</p>
        <p>Customer</p>
        <p>Method</p>
        <p>Amount</p>
        <p>Fee</p>
        <p>Status</p>
        <p>Date</p>
      </div>

      <div className="max-h-[420px] overflow-y-auto">
        {displayedActivities.map((activity) => (
          <article
            key={activity.id}
            className="grid gap-2 border-b border-(--color-accent)/25 px-5 py-3 last:border-b-0 lg:grid-cols-[132px_1.8fr_124px_108px_124px_108px_138px] lg:items-center lg:gap-3"
          >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 lg:hidden">
              <div
                className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${directionAccentClass(
                  activity.direction,
                )}`}
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                  {activity.direction === 'inflow' ? (
                    <path d="M10 3.5a.75.75 0 0 1 .75.75v8.44l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V4.25A.75.75 0 0 1 10 3.5Z" />
                  ) : (
                    <path d="M10 16.5a.75.75 0 0 1-.75-.75V7.31l-2.22 2.22a.75.75 0 1 1-1.06-1.06l3.5-3.5a.75.75 0 0 1 1.06 0l3.5 3.5a.75.75 0 1 1-1.06 1.06l-2.22-2.22v8.44A.75.75 0 0 1 10 16.5Z" />
                  )}
                </svg>
              </div>

              <div className="min-w-0">
                <p className="truncate [font-family:var(--font-display)] text-[0.98rem] font-semibold leading-tight text-(--color-foreground)">
                  {activity.type}
                </p>
                <p className="truncate [font-family:var(--font-body)] text-[11px] text-(--color-secondary)">
                  {activity.counterparty}
                </p>
                <p className="mt-0.5 [font-family:var(--font-body)] text-[11px] text-(--color-secondary)">
                  {activity.date}, {activity.time}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2.5 [font-family:var(--font-body)] text-[10px] text-(--color-secondary)">
                  <span>Fee: {activity.fee}</span>
                  <span>Bal: {activity.balance}</span>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={`[font-family:var(--font-display)] text-[1.7rem] font-semibold leading-tight ${
                    activity.direction === 'inflow'
                      ? 'text-emerald-600'
                      : 'text-(--color-foreground)'
                  }`}
                >
                  {activity.amount}
                </p>
                <span
                  className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-[11px] font-semibold ${statusClassName(
                    activity.status,
                  )}`}
                >
                  {activity.status}
                </span>

                <div className="mt-1.5 flex items-center justify-end gap-1 text-(--color-secondary)">
                  <button
                    type="button"
                    className="inline-flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-md border border-(--color-accent)/35"
                    aria-label={`Copy ${activity.id}`}
                  >
                    <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current">
                      <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h6.5A1.75 1.75 0 0 1 16 4.75v8.5A1.75 1.75 0 0 1 14.25 15h-6.5A1.75 1.75 0 0 1 6 13.25v-8.5Zm-2 2A1.75 1.75 0 0 0 2.25 8.5v7A1.75 1.75 0 0 0 4 17.25h6a.75.75 0 0 0 0-1.5H4a.25.25 0 0 1-.25-.25v-7A.25.25 0 0 1 4 8.25h.75a.75.75 0 0 0 0-1.5H4Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <p className="hidden [font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground) lg:block">
              {activity.id}
            </p>

            <div className="hidden min-w-0 lg:block">
              <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {activityCustomerLabel(activity.counterparty)}
              </p>
            </div>

            <p
              className="hidden [font-family:var(--font-body)] text-sm text-(--color-foreground) lg:block"
            >
              {activityMethodLabel(activity.type)}
            </p>

            <p
              className={`hidden [font-family:var(--font-body)] text-sm lg:block ${
                activity.direction === 'inflow'
                  ? 'text-emerald-600'
                  : 'text-(--color-foreground)'
              }`}
            >
              {activity.amount}
            </p>

            <p className="hidden [font-family:var(--font-body)] text-sm text-(--color-secondary) lg:block">
              {activity.fee}
            </p>

            <div className="hidden lg:block">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 [font-family:var(--font-body)] text-xs font-semibold ${statusClassName(
                  activity.status,
                )}`}
              >
                {activity.status}
              </span>
            </div>

            <p className="hidden [font-family:var(--font-body)] text-xs text-(--color-secondary) lg:block">
              {activity.date} {activity.time}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
