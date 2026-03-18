import {
  DEVELOPER_DOCS_URL,
  accountTabs,
  developerTabs,
  type SettingsTabId,
} from './settingsTabs.ts'

interface SettingsTabsSidebarProps {
  activeTab: SettingsTabId
  onSelectTab: (tabId: SettingsTabId) => void
}

function DeveloperDocsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M4.75 3.5A1.25 1.25 0 0 0 3.5 4.75v10.5A1.25 1.25 0 0 0 4.75 16.5h10.5a1.25 1.25 0 0 0 1.25-1.25v-4a.75.75 0 0 0-1.5 0v4a.25.25 0 0 1-.25.25H4.75a.25.25 0 0 1-.25-.25V4.75a.25.25 0 0 1 .25-.25h4a.75.75 0 0 0 0-1.5h-4ZM11 3.5a.75.75 0 0 0 0 1.5h2.94L8.22 10.72a.75.75 0 1 0 1.06 1.06L15 6.06V9a.75.75 0 0 0 1.5 0V3.5H11Z" />
    </svg>
  )
}

export function SettingsTabsSidebar({
  activeTab,
  onSelectTab,
}: SettingsTabsSidebarProps) {
  return (
    <aside className="h-[420px] shrink-0 overflow-hidden rounded-xl border border-(--color-accent)/35 bg-(--color-card) p-3.5">
      <div className="flex h-full min-h-0 flex-col overflow-y-auto pr-1">
        <nav className="space-y-1">
          {accountTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`block w-full cursor-pointer px-2 py-1.5 text-left [font-family:var(--font-body)] text-sm transition ${
                  isActive
                    ? 'border-l-2 border-amber-500 font-semibold text-(--color-foreground)'
                    : 'text-(--color-muted) hover:text-(--color-foreground)'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-4.5">
          <p className="[font-family:var(--font-body)] text-xs uppercase tracking-wide text-(--color-secondary)">
            Developers
          </p>
          <nav className="mt-1.5 space-y-1">
            {developerTabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`inline-flex w-full cursor-pointer items-center gap-1.5 px-2 py-1.5 text-left [font-family:var(--font-body)] text-sm transition ${
                    isActive
                      ? 'border-l-2 border-amber-500 font-semibold text-(--color-foreground)'
                      : 'text-(--color-muted) hover:text-(--color-foreground)'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              )
            })}

            <a
              href={DEVELOPER_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center gap-1.5 px-2 py-1.5 text-left [font-family:var(--font-body)] text-sm transition text-(--color-muted) hover:text-(--color-foreground)"
            >
              <span>Developer docs</span>
              <DeveloperDocsIcon />
            </a>
          </nav>
        </div>
      </div>
    </aside>
  )
}
