import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Route } from '../../../routes/dashboard.settings.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { SettingsTabContentPanel } from '../components/settings/SettingsTabContentPanel.tsx'
import { SettingsTabsSidebar } from '../components/settings/SettingsTabsSidebar.tsx'
import type { SettingsTabId } from '../components/settings/settingsTabs.ts'

export function DashboardSettingsPage() {
  const navigate = useNavigate({ from: Route.fullPath })
  const { tab: tabFromSearch } = Route.useSearch()
  const { mfaSetupRequired, isAdmin } = usePortalRole()
  const activeTab: SettingsTabId = mfaSetupRequired
    ? 'security'
    : (tabFromSearch ?? 'profile')

  useEffect(() => {
    if (mfaSetupRequired && tabFromSearch !== 'security') {
      void navigate({
        search: { tab: 'security' },
        replace: true,
      })
    }
  }, [mfaSetupRequired, tabFromSearch, navigate])

  function handleSelectTab(tabId: SettingsTabId) {
    if (mfaSetupRequired && tabId !== 'security') {
      return
    }
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
          {mfaSetupRequired
            ? 'Enroll multi-factor authentication to continue using the merchant portal.'
            : 'Manage profile, team access, and developer integration settings.'}
        </p>
      </header>

      <div className="settings-layout">
        <SettingsTabsSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          mfaSetupRequired={mfaSetupRequired}
          isAdmin={isAdmin}
        />
        <SettingsTabContentPanel activeTab={activeTab} />
      </div>
    </section>
  )
}
