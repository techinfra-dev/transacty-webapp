import { BANGLADESH_RAIL_PAUSED, BANGLADESH_RAIL_PAUSE_COPY } from '../../utils/bangladeshRailPause.ts'

type CustomersPageHeaderProps = {
  onCreate: () => void
}

export function CustomersPageHeader({ onCreate }: CustomersPageHeaderProps) {
  return (
    <header className="customers-head">
      <div>
        <h1 className="customers-title">Customers</h1>
        <p className="customers-sub">
          {BANGLADESH_RAIL_PAUSED
            ? `${BANGLADESH_RAIL_PAUSE_COPY} New Bangladesh customer wallets cannot be created right now.`
            : 'Manage customer wallets, monitor balances, and review account status.'}
        </p>
      </div>
      <button
        type="button"
        className="customers-btn customers-btn--primary"
        onClick={onCreate}
        disabled={BANGLADESH_RAIL_PAUSED}
        title={BANGLADESH_RAIL_PAUSED ? BANGLADESH_RAIL_PAUSE_COPY : undefined}
      >
        Add customer
      </button>
    </header>
  )
}
