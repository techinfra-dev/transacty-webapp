interface SidebarSection {
  title: string
  items: string[]
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Overview',
    items: ['Dashboard', 'Analytics', 'Accounts'],
  },
  {
    title: 'Payments',
    items: ['Transactions', 'Customers', 'Payouts', 'Disputes'],
  },
  {
    title: 'Settings',
    items: ['Team', 'Integrations', 'Preferences'],
  },
]

export function DashboardSidebar() {
  return (
    <aside className="hidden h-full border-r border-(--color-accent)/35 bg-(--color-primary) text-(--color-background) lg:block">
      <div className="flex h-full flex-col p-5">
        <div className="rounded-xl border border-(--color-background)/20 bg-(--color-background)/10 px-4 py-3">
          <p className="[font-family:var(--font-display)] text-lg font-semibold">
            Transcaty
          </p>
          <p className="mt-1 [font-family:var(--font-body)] text-xs text-(--color-background)/80">
            Merchant workspace
          </p>
        </div>

        <nav className="mt-6 space-y-6">
          {sidebarSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="[font-family:var(--font-body)] text-xs uppercase tracking-wide text-(--color-background)/65">
                {section.title}
              </p>
              <ul className="space-y-1.5">
                {section.items.map((item, index) => (
                  <li
                    key={item}
                    className={`rounded-lg px-3 py-2 [font-family:var(--font-body)] text-sm transition ${
                      section.title === 'Overview' && index === 0
                        ? 'bg-(--color-background)/20 font-semibold'
                        : 'text-(--color-background)/85 hover:bg-(--color-background)/12'
                    }`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
