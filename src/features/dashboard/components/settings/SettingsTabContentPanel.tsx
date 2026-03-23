import { tabContent, type SettingsTabId } from './settingsTabs.ts'
import { ApiKeysSettingsContent } from './ApiKeysSettingsContent.tsx'
import { ProfileSettingsContent } from './ProfileSettingsContent.tsx'
import { SecuritySettingsContent } from './SecuritySettingsContent.tsx'
import { TeamSettingsContent } from './TeamSettingsContent.tsx'

interface SettingsTabContentPanelProps {
  activeTab: SettingsTabId
}

export function SettingsTabContentPanel({
  activeTab,
}: SettingsTabContentPanelProps) {
  if (activeTab === 'profile') {
    return (
      <article
        key={activeTab}
        className="settings-tab-enter h-full rounded-xl bg-(--color-background)/30 p-4 md:p-5"
      >
        <ProfileSettingsContent />
      </article>
    )
  }

  if (activeTab === 'api-keys') {
    return (
      <article
        key={activeTab}
        className="settings-tab-enter h-full rounded-xl bg-(--color-background)/30 p-4 md:p-5"
      >
        <ApiKeysSettingsContent />
      </article>
    )
  }

  if (activeTab === 'security') {
    return (
      <article
        key={activeTab}
        className="settings-tab-enter h-full rounded-xl bg-(--color-background)/30 p-4 md:p-5"
      >
        <SecuritySettingsContent />
      </article>
    )
  }

  if (activeTab === 'team') {
    return (
      <article
        key={activeTab}
        className="settings-tab-enter h-full rounded-xl bg-(--color-background)/30 p-4 md:p-5"
      >
        <TeamSettingsContent />
      </article>
    )
  }

  const currentTabContent = tabContent[activeTab]

  return (
    <article
      key={activeTab}
      className="settings-tab-enter h-full rounded-xl bg-(--color-background)/30 p-4 md:p-5"
    >
      <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
        {currentTabContent.title}
      </h2>
      <p className="mt-2 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
        {currentTabContent.description}
      </p>
    </article>
  )
}
