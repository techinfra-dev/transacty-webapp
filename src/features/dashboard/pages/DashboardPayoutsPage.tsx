export function DashboardPayoutsPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
          Payouts
        </h1>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Dummy payouts content for now.
        </p>
      </header>

      <div className="rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Payout queue and transfer history UI will be added in the next pass.
        </p>
      </div>
    </section>
  )
}
