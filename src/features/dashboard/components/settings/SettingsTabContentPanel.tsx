import { tabContent, type SettingsTabId } from './settingsTabs.ts'
import { ApiKeysSettingsContent } from './ApiKeysSettingsContent.tsx'
import { ProfileSettingsContent } from './ProfileSettingsContent.tsx'
import { SecuritySettingsContent } from './SecuritySettingsContent.tsx'
import { TeamSettingsContent } from './TeamSettingsContent.tsx'
import { WebhooksSettingsContent } from './WebhooksSettingsContent.tsx'
import { MarketsSettingsContent } from './MarketsSettingsContent.tsx'
import { ReconciliationSettingsContent } from './ReconciliationSettingsContent.tsx'

interface SettingsTabContentPanelProps {
  activeTab: SettingsTabId
}

function SettingsSectionHead({ title, description }: { title: string; description: string }) {
  return (
    <header className="settings-section-head">
      <h2 className="settings-section-title">{title}</h2>
      <p className="settings-section-desc">{description}</p>
    </header>
  )
}

export function SettingsTabContentPanel({ activeTab }: SettingsTabContentPanelProps) {
  const currentTabContent = tabContent[activeTab]

  return (
    <div key={activeTab} className="settings-content settings-tab-enter">
      <SettingsSectionHead
        title={currentTabContent.title}
        description={currentTabContent.description}
      />

      {activeTab === 'profile' ? <ProfileSettingsContent /> : null}
      {activeTab === 'security' ? <SecuritySettingsContent /> : null}
      {activeTab === 'team' ? <TeamSettingsContent /> : null}
      {activeTab === 'api-keys' ? <ApiKeysSettingsContent /> : null}
      {activeTab === 'webhooks' ? <WebhooksSettingsContent /> : null}
      {activeTab === 'markets' ? <MarketsSettingsContent /> : null}
      {activeTab === 'reconciliation-report' ? (
        <ReconciliationSettingsContent />
      ) : null}

      {activeTab !== 'profile' &&
      activeTab !== 'security' &&
      activeTab !== 'markets' &&
      activeTab !== 'team' &&
      activeTab !== 'api-keys' &&
      activeTab !== 'webhooks' &&
      activeTab !== 'reconciliation-report' ? (
        <article className="settings-card">
          <div className="settings-card-body">
            <p className="settings-placeholder">
              This section is coming soon. Check back for updates to{' '}
              {currentTabContent.title.toLowerCase()}.
            </p>
          </div>
        </article>
      ) : null}
    </div>
  )
}
