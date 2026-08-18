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
  SettingsIconFees,
  SettingsIconMarkets,
  SettingsIconProfile,
  SettingsIconSecurity,
  SettingsIconWebhooks,
  SettingsIconReconciliation,
  SettingsIconWhitelist,
} from './settingsNavIcons.tsx'

interface SettingsTabsSidebarProps {
  activeTab: SettingsTabId
  onSelectTab: (tabId: SettingsTabId) => void
  mfaSetupRequired?: boolean
  isAdmin?: boolean
}

function tabIcon(tabId: SettingsTabId) {
  switch (tabId) {
    case 'profile':
      return <SettingsIconProfile />
    case 'security':
      return <SettingsIconSecurity />
    case 'markets':
      return <SettingsIconMarkets />
    case 'fees':
      return <SettingsIconFees />
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
  mfaSetupRequired = false,
  isAdmin = true,
}: SettingsTabsSidebarProps) {
  return (
    <aside className="settings-nav">
      <div className="settings-nav-group">
        <p className="settings-nav-group-label">Account</p>
        <nav className="settings-nav-list">
          {accountTabs.map((tab) => {
            const isActive = activeTab === tab.id
            const isLocked = mfaSetupRequired && tab.id !== 'security'
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                disabled={isLocked}
                className={`settings-nav-item ${isActive ? 'settings-nav-item--active' : ''} ${isLocked ? 'opacity-45' : ''}`}
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
            const isLocked = mfaSetupRequired || !isAdmin
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                disabled={isLocked}
                className={`settings-nav-item ${isActive ? 'settings-nav-item--active' : ''} ${isLocked ? 'opacity-45' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                title={
                  !isAdmin && !mfaSetupRequired
                    ? 'Admin role required'
                    : undefined
                }
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
