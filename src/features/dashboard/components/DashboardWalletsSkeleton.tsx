function WalletCardSkeleton() {
  return (
    <div
      className="dashboard-wallet min-h-[124px] animate-pulse pointer-events-none"
      aria-hidden
    >
      <div className="flex gap-2">
        <div className="h-5 w-10 rounded bg-[#F2F1ED]" />
        <div className="h-4 w-28 rounded bg-[#F2F1ED]" />
      </div>
      <div className="h-8 w-28 rounded bg-[#F2F1ED]" />
      <div className="flex gap-2 border-t border-[rgba(15,7,0,0.05)] pt-2">
        <div className="h-5 w-14 rounded-full bg-[#F2F1ED]" />
        <div className="ml-auto h-3 w-16 rounded bg-[#F2F1ED]" />
      </div>
    </div>
  )
}

function AddWalletCardSkeleton() {
  return (
    <div
      className="flex min-h-[124px] animate-pulse flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[rgba(15,7,0,0.12)] bg-white p-4"
      aria-hidden
    >
      <div className="h-9 w-9 rounded-full border border-dashed border-[#E8E8E8] bg-[#F6F6F6]" />
      <div className="h-3 w-16 rounded bg-[#F2F1ED]" />
      <div className="h-3 w-32 max-w-full rounded bg-[#F2F1ED]" />
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
