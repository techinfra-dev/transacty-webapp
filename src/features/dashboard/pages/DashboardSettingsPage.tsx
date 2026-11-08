import { useNavigate } from '@tanstack/react-router'
import { Route } from '../../../routes/dashboard.settings.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { SettingsTabContentPanel } from '../components/settings/SettingsTabContentPanel.tsx'
import { SettingsTabsSidebar } from '../components/settings/SettingsTabsSidebar.tsx'
import type { SettingsTabId } from '../components/settings/settingsTabs.ts'

export function DashboardSettingsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { tab: tabFromSearch } = Route.useSearch()
  const { isAdmin } = usePortalRole()
  const activeTab: SettingsTabId = tabFromSearch ?? 'profile'

  function handleSelectTab(tabId: SettingsTabId) {
    if (
      (tabId === 'api-keys' || tabId === 'webhooks') &&
      !isAdmin
    ) {
      return
    }
    void navigate({
      search: { tab: tabId },
    })
  }

  return (
    <section className="settings-page app-page-enter">
      <header className="settings-head">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">
          Manage profile, team access, and developer integration settings.
        </p>
      </header>

      <div className="settings-layout">
        <SettingsTabsSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isAdmin={isAdmin}
        />
        <SettingsTabContentPanel activeTab={activeTab} />
      </div>
    </section>
  )
}
