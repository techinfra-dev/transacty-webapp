import {
  DEVELOPER_DOCS_URL,
  accountTabs,
  developerTabs,
  type SettingsTabId,
} from './settingsTabs.ts'
import {
  SettingsIconApiKeys,
  SettingsIconDeveloperDocs,
  SettingsIconDirectors,
  SettingsIconProfile,
  SettingsIconSecurity,
  SettingsIconWebhooks,
  SettingsIconWhitelist,
} from './settingsNavIcons.tsx'

interface SettingsTabsSidebarProps {
  activeTab: SettingsTabId
  onSelectTab: (tabId: SettingsTabId) => void
}

function tabIcon(tabId: SettingsTabId) {
  switch (tabId) {
    case 'profile':
      return <SettingsIconProfile />
    case 'security':
      return <SettingsIconSecurity />
    case 'team':
      return <SettingsIconDirectors />
    case 'whitelisted-ip-addresses':
      return <SettingsIconWhitelist />
    case 'api-keys':
      return <SettingsIconApiKeys />
    case 'webhooks':
      return <SettingsIconWebhooks />
    default:
      return <SettingsIconProfile />
  }
}

const navButtonClass = (isActive: boolean) =>
  [
    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left [font-family:var(--font-body)] text-sm transition',
    isActive
      ? 'border border-[#E0D4C4] bg-[#F3E8D6] font-semibold text-[#0F0700] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
      : 'border border-transparent text-[#566167] hover:border-[#E0DCD6]/80 hover:bg-[#F7F4EF]',
  ].join(' ')

export function SettingsTabsSidebar({
  activeTab,
  onSelectTab,
}: SettingsTabsSidebarProps) {
  return (
    <aside className="shrink-0 rounded-2xl border border-[#E8E2DA] bg-[#FCFAF7] p-3 shadow-[0_1px_3px_rgba(15,7,0,0.06)] md:w-[260px]">
      <div className="flex min-h-0 flex-col">
        <nav className="space-y-1">
          {accountTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={navButtonClass(isActive)}
              >
                <span className={isActive ? 'text-[#0F0700]' : 'text-[#566167]'}>
                  {tabIcon(tab.id)}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-5 border-t border-[#E8E2DA] pt-4">
          <p className="px-3 [font-family:var(--font-body)] text-[10px] font-semibold uppercase tracking-wider text-[#9D8F82]">
            Developers
          </p>
          <nav className="mt-2 space-y-1">
            {developerTabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={navButtonClass(isActive)}
                >
                  <span className={isActive ? 'text-[#0F0700]' : 'text-[#566167]'}>
                    {tabIcon(tab.id)}
                  </span>
                  <span>{tab.label}</span>
                </button>
              )
            })}

            <a
              href={DEVELOPER_DOCS_URL}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 [font-family:var(--font-body)] text-sm text-[#566167] transition hover:border-[#E0DCD6]/80 hover:bg-[#F7F4EF]"
            >
              <SettingsIconDeveloperDocs />
              <span>Developer docs</span>
            </a>
          </nav>
        </div>
      </div>
    </aside>
  )
}
