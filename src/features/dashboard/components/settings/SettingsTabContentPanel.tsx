import { tabContent, type SettingsTabId } from './settingsTabs.ts'
import { ApiKeysSettingsContent } from './ApiKeysSettingsContent.tsx'
import { ProfileSettingsContent } from './ProfileSettingsContent.tsx'
import { SecuritySettingsContent } from './SecuritySettingsContent.tsx'
import { TeamSettingsContent } from './TeamSettingsContent.tsx'
import { WebhooksSettingsContent } from './WebhooksSettingsContent.tsx'

const panelShell =
  'settings-tab-enter min-h-[min(420px,70vh)] rounded-xl border border-[#E0DCD6] bg-[#FAF8F5] p-5 shadow-sm md:p-6'

const profileShell = 'settings-tab-enter min-h-[min(420px,70vh)]'

interface SettingsTabContentPanelProps {
  activeTab: SettingsTabId
}

export function SettingsTabContentPanel({
  activeTab,
}: SettingsTabContentPanelProps) {
  if (activeTab === 'profile') {
    return (
      <article key={activeTab} className={profileShell}>
        <ProfileSettingsContent />
      </article>
    )
  }

  if (activeTab === 'api-keys') {
    return (
      <article key={activeTab} className={panelShell}>
        <ApiKeysSettingsContent />
      </article>
    )
  }

  if (activeTab === 'webhooks') {
    return (
      <article key={activeTab} className={panelShell}>
        <WebhooksSettingsContent />
      </article>
    )
  }

  if (activeTab === 'security') {
    return (
      <article key={activeTab} className={panelShell}>
        <SecuritySettingsContent />
      </article>
    )
  }

  if (activeTab === 'team') {
    return (
      <article key={activeTab} className={panelShell}>
        <TeamSettingsContent />
      </article>
    )
  }

  const currentTabContent = tabContent[activeTab]

  return (
    <article key={activeTab} className={panelShell}>
      <h1 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#0F0700] md:text-3xl">
        {currentTabContent.title}
      </h1>
      <p className="mt-2 max-w-2xl [font-family:var(--font-body)] text-sm leading-relaxed text-[#566167]">
        {currentTabContent.description}
      </p>
    </article>
  )
}
