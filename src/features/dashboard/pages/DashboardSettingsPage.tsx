import { useState } from 'react'
import { SettingsTabContentPanel } from '../components/settings/SettingsTabContentPanel.tsx'
import { SettingsTabsSidebar } from '../components/settings/SettingsTabsSidebar.tsx'
import type { SettingsTabId } from '../components/settings/settingsTabs.ts'

export function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')

  return (
    <section className="settings-page app-page-enter">
      <header className="settings-head">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-sub">
          Manage profile, team access, and developer integration settings.
        </p>
      </header>

      <div className="settings-layout">
        <SettingsTabsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <SettingsTabContentPanel activeTab={activeTab} />
      </div>
    </section>
  )
}
