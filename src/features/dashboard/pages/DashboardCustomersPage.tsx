export function DashboardCustomersPage() {
  return (
    <section className="space-y-5">
      <header>
        <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
          Customers
        </h1>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Dummy customers content for now.
        </p>
      </header>

      <div className="rounded-2xl border border-(--color-accent)/45 bg-(--color-card) p-5">
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Customer list and profile cards will be implemented next.
        </p>
      </div>
    </section>
  )
}
