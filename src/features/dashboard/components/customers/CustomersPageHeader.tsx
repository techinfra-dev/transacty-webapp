type CustomersPageHeaderProps = {
  onCreate: () => void
}

export function CustomersPageHeader({ onCreate }: CustomersPageHeaderProps) {
  return (
    <header className="customers-head">
      <div>
        <h1 className="customers-title">Customers</h1>
        <p className="customers-sub">
          Manage customer wallets, monitor balances, and review account status.
        </p>
      </div>
      <button type="button" className="customers-btn customers-btn--primary" onClick={onCreate}>
        Add customer
      </button>
    </header>
  )
}
