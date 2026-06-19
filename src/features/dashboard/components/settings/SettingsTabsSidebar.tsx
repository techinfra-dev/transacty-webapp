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
  SettingsIconReconciliation,
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
    case 'reconciliation-report':
      return <SettingsIconReconciliation />
    case 'api-keys':
      return <SettingsIconApiKeys />
    case 'webhooks':
      return <SettingsIconWebhooks />
    default:
      return <SettingsIconProfile />
  }
}

export function SettingsTabsSidebar({
  activeTab,
  onSelectTab,
}: SettingsTabsSidebarProps) {
  return (
    <aside className="settings-nav">
      <div className="settings-nav-group">
        <p className="settings-nav-group-label">Account</p>
        <nav className="settings-nav-list">
          {accountTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`settings-nav-item ${isActive ? 'settings-nav-item--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="settings-nav-item-icon" aria-hidden>
                  {tabIcon(tab.id)}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="settings-nav-group">
        <p className="settings-nav-group-label">Developers</p>
        <nav className="settings-nav-list">
          {developerTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`settings-nav-item ${isActive ? 'settings-nav-item--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="settings-nav-item-icon" aria-hidden>
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
            className="settings-nav-item settings-nav-item--link"
          >
            <span className="settings-nav-item-icon" aria-hidden>
              <SettingsIconDeveloperDocs />
            </span>
            <span>Developer docs</span>
          </a>
        </nav>
      </div>
    </aside>
  )
}
