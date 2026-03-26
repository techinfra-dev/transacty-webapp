import { useState } from 'react'
import { SettingsTabContentPanel } from '../components/settings/SettingsTabContentPanel.tsx'
import { SettingsTabsSidebar } from '../components/settings/SettingsTabsSidebar.tsx'
import type { SettingsTabId } from '../components/settings/settingsTabs.ts'

export function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile')

  return (
    <section className="app-page-enter space-y-6 pt-1 md:space-y-8 md:pt-2">
      <header className="max-w-3xl">
        <p className="[font-family:var(--font-body)] text-xs font-semibold uppercase tracking-[0.12em] text-[#9D8F82]">
          Workspace & account
        </p>
        <h1 className="mt-2 [font-family:var(--font-display)] text-3xl font-semibold tracking-tight text-[#0F0700] md:text-[2rem] md:leading-tight">
          Settings
        </h1>
        <p className="mt-2 [font-family:var(--font-body)] text-sm leading-relaxed text-[#566167]">
          Manage profile, team access, and developer integration settings.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,auto)_minmax(0,1fr)] md:items-start md:gap-8 lg:gap-10">
        <SettingsTabsSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <SettingsTabContentPanel activeTab={activeTab} />
      </div>
    </section>
  )
}
