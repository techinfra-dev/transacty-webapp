function WalletCardSkeleton() {
  return (
    <div
      className="dashboard-wallet min-h-[124px] animate-pulse pointer-events-none"
      aria-hidden
    >
      <div className="flex gap-2">
        <div className="dashboard-skeleton-block h-5 w-10" />
        <div className="dashboard-skeleton-block h-4 w-28" />
      </div>
      <div className="dashboard-skeleton-block h-8 w-28" />
      <div className="dashboard-wallet-footer">
        <div className="dashboard-skeleton-block h-5 w-14 rounded-full" />
        <div className="dashboard-skeleton-block ml-auto h-3 w-16" />
      </div>
    </div>
  )
}

function AddWalletCardSkeleton() {
  return (
    <div
      className="dashboard-add-wallet animate-pulse pointer-events-none"
      aria-hidden
    >
      <div className="dashboard-skeleton-block h-9 w-9 rounded-full" />
      <div className="dashboard-skeleton-block h-3 w-16" />
      <div className="dashboard-skeleton-block h-3 w-32 max-w-full" />
    </div>
  )
}

export function DashboardWalletsSkeleton() {
  return (
    <section
      className="dashboard-wallets-grid"
      aria-busy="true"
      aria-label="Loading wallets"
    >
      <span className="sr-only">Loading wallets…</span>
      <WalletCardSkeleton />
      <WalletCardSkeleton />
      <WalletCardSkeleton />
      <AddWalletCardSkeleton />
    </section>
  )
}
