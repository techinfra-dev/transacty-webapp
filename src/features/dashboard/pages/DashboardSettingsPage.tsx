import { useState } from 'react'
import { SettingsTabContentPanel } from '../components/settings/SettingsTabContentPanel.tsx'
import { SettingsTabsSidebar } from '../components/settings/SettingsTabsSidebar.tsx'
import type { SettingsTabId } from '../components/settings/settingsTabs.ts'

export function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')

  return (
    <section className="space-y-5">
      <header>
        <h1 className="[font-family:var(--font-display)] text-3xl font-semibold text-(--color-foreground)">
          Settings
        </h1>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Manage profile, team access, and developer integration settings.
        </p>
      </header>

      <section className="grid min-h-[420px] flex-1 gap-4 rounded-2xl p-4 md:grid-cols-[260px_1fr] md:p-5">
        <SettingsTabsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <SettingsTabContentPanel activeTab={activeTab} />
      </section>
    </section>
  )
}
