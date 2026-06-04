interface DashboardAddWalletCardProps {
  onClick?: () => void
}

export function DashboardAddWalletCard({ onClick }: DashboardAddWalletCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        onClick?.()
      }}
      aria-label="Add wallet — activate another merchant pocket"
      className="dashboard-add-wallet"
    >
      <span className="dashboard-add-wallet-icon">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className="dashboard-add-wallet-title">Add wallet</span>
      <span className="dashboard-add-wallet-desc">
        Create another merchant pocket for this environment
      </span>
    </button>
  )
}
