import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { usePortalRole } from '../../../../hooks/usePortalRole.ts'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import {
  useReplayWebhookDeliveryMutation,
  useTestWebhookMutation,
  useWebhookDeliveriesQuery,
} from '../../hooks/useWebhookDeliveries.ts'
import {
  useUpdateWebhookMutation,
  useWebhookQuery,
} from '../../hooks/useWebhookSettings.ts'
import { DEVELOPER_DOCS_URL } from './settingsTabs.ts'
import { SettingsCard } from './SettingsCard.tsx'
import { SettingsKycGate } from './SettingsKycGate.tsx'
import {
  settingsFieldInputClass,
  settingsFieldLabelClass,
} from './settingsFieldUtils.ts'

export function WebhooksSettingsContent() {
  const [urlDraft, setUrlDraft] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [secretDialogValue, setSecretDialogValue] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const { isAdmin } = usePortalRole()
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isKycPendingVerification =
    profileQuery.data?.kycStatus === 'pending' &&
    profileQuery.data?.businessProfile?.status === 'submitted'
  const webhookQuery = useWebhookQuery(isKycVerified && isAdmin)
  const updateWebhookMutation = useUpdateWebhookMutation()
  const deliveriesQuery = useWebhookDeliveriesQuery(isKycVerified && isAdmin)
  const replayDeliveryMutation = useReplayWebhookDeliveryMutation()
  const testWebhookMutation = useTestWebhookMutation()
  const [deliveryActionError, setDeliveryActionError] = useState<string | null>(
    null,
  )
  const [testMessage, setTestMessage] = useState<string | null>(null)

  useEffect(() => {
    if (webhookQuery.data) {
      setUrlDraft(webhookQuery.data.webhookUrl ?? '')
    }
  }, [webhookQuery.data?.webhookUrl])

  async function handleCopySecret() {
    if (!secretDialogValue) {
      return
    }
    try {
      await navigator.clipboard.writeText(secretDialogValue)
      setCopiedSecret(true)
      window.setTimeout(() => setCopiedSecret(false), 1800)
    } catch {
      setCopiedSecret(false)
    }
  }

  async function handleSave() {
    setValidationError(null)
    setMutationError(null)
    const trimmed = urlDraft.trim()
    if (!trimmed) {
      setValidationError(
        'Enter a valid HTTPS URL, or use Remove webhook to disable delivery.',
      )
      return
    }
    if (!trimmed.startsWith('https://')) {
      setValidationError('Webhook URL must use https://.')
      return
    }
    const parsed = z.string().url().safeParse(trimmed)
    if (!parsed.success) {
      setValidationError('Enter a valid URL.')
      return
    }
    try {
      const res = await updateWebhookMutation.mutateAsync({
        webhookUrl: parsed.data,
      })
      if (res.webhookSecret) {
        setSecretDialogValue(res.webhookSecret)
      }
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : 'Unable to save webhook URL.',
      )
    }
  }

  async function handleRemove() {
    setValidationError(null)
    setMutationError(null)
    try {
      await updateWebhookMutation.mutateAsync({ webhookUrl: null })
      setUrlDraft('')
      setSecretDialogValue(null)
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : 'Unable to remove webhook.',
      )
    }
  }

  async function handleTestWebhook() {
    setDeliveryActionError(null)
    setTestMessage(null)
    try {
      const result = await testWebhookMutation.mutateAsync()
      setTestMessage(
        result.message ||
          (result.ok === false ? 'Test webhook failed.' : 'Test webhook sent.'),
      )
    } catch (error) {
      setDeliveryActionError(
        error instanceof Error ? error.message : 'Unable to send test webhook.',
      )
    }
  }

  async function handleReplay(deliveryId: string) {
    setDeliveryActionError(null)
    try {
      await replayDeliveryMutation.mutateAsync(deliveryId)
    } catch (error) {
      setDeliveryActionError(
        error instanceof Error
          ? error.message
          : 'Unable to replay this delivery.',
      )
    }
  }

  if (profileQuery.isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading profile…" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <p className="settings-error">Unable to verify KYC status right now.</p>
  }

  if (!isAdmin) {
    return (
      <p className="settings-dev-alert">
        Admin role required to manage webhook settings.
      </p>
    )
  }

  return (
    <div className="settings-stack">
      {!isKycVerified ? (
        <SettingsKycGate
          title={
            isKycPendingVerification
              ? 'KYC pending verification'
              : 'KYC verification required'
          }
          description={
            isKycPendingVerification
              ? 'Your KYC has been submitted and is currently under review. Webhook configuration will unlock after approval.'
              : 'Complete KYC verification to configure webhook URLs and receive event notifications.'
          }
          showCta={!isKycPendingVerification}
          onCta={openKycDialog}
        />
      ) : webhookQuery.isPending ? (
        <div className="settings-loading">
          <LoadingSpinner label="Loading webhook settings…" />
        </div>
      ) : webhookQuery.isError || !webhookQuery.data ? (
        <p className="settings-dev-alert">
          {(webhookQuery.error as Error | undefined)?.message ??
            'Unable to load webhook settings right now.'}
        </p>
      ) : (
        <SettingsCard
          title="Endpoint URL"
          description="Transacty sends signed POST requests to this URL."
          footer={
            <div className="settings-dev-actions-row">
              <button
                type="button"
                className="settings-btn settings-btn--primary"
                onClick={() => void handleSave()}
                disabled={updateWebhookMutation.isPending}
                aria-busy={updateWebhookMutation.isPending}
              >
                {updateWebhookMutation.isPending ? 'Saving…' : 'Save webhook'}
              </button>
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={() => void handleRemove()}
                disabled={
                  updateWebhookMutation.isPending || !webhookQuery.data.webhookUrl
                }
              >
                Remove webhook
              </button>
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={() => void handleTestWebhook()}
                disabled={
                  testWebhookMutation.isPending || !webhookQuery.data.webhookUrl
                }
              >
                {testWebhookMutation.isPending ? 'Sending…' : 'Send test'}
              </button>
            </div>
          }
        >
          <p className="settings-hint">
            Use{' '}
            <a
              href={`${DEVELOPER_DOCS_URL}/webhooks`}
              target="_blank"
              rel="noreferrer"
              className="settings-link"
            >
              developer documentation
            </a>{' '}
            for payload shapes and verification steps.
          </p>

          <label className="settings-field settings-field--full">
            <span className={settingsFieldLabelClass}>Webhook URL</span>
            <Input
              id="webhook-url-input"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://merchant.com/webhooks/transacty"
              value={urlDraft}
              onChange={(event) => setUrlDraft(event.target.value)}
              disabled={updateWebhookMutation.isPending}
              className={settingsFieldInputClass}
            />
          </label>

          {validationError ? (
            <p className="settings-error settings-error--inline">{validationError}</p>
          ) : null}
          {mutationError ? (
            <p className="settings-error settings-error--inline">{mutationError}</p>
          ) : null}

          <p className="settings-hint">
            When you save a URL, a new signing secret is generated. Store it only on your
            server—never in client-side code or public repos.
          </p>
        </SettingsCard>
      )}

      {isKycVerified && isAdmin ? (
        <SettingsCard
          title="Delivery log"
          description="Recent outbound webhook attempts, including lastError for failed sends."
        >
          {testMessage ? (
            <p className="settings-hint mb-2">{testMessage}</p>
          ) : null}
          {deliveryActionError ? (
            <p className="settings-error settings-error--inline mb-2">
              {deliveryActionError}
            </p>
          ) : null}
          {deliveriesQuery.isPending ? (
            <div className="settings-loading">
              <LoadingSpinner label="Loading deliveries…" />
            </div>
          ) : deliveriesQuery.isError ? (
            <p className="settings-error settings-error--inline">
              {deliveriesQuery.error instanceof Error
                ? deliveriesQuery.error.message
                : 'Unable to load deliveries.'}
            </p>
          ) : (deliveriesQuery.data?.items.length ?? 0) === 0 ? (
            <p className="settings-hint">No deliveries recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {deliveriesQuery.data?.items.map((delivery) => (
                <li
                  key={delivery.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-(--color-accent)/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="[font-family:var(--font-body)] text-sm font-medium text-(--color-primary)">
                      {delivery.eventType || delivery.event || 'event'} ·{' '}
                      {delivery.status}
                    </p>
                    <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                      {delivery.createdAt
                        ? new Date(delivery.createdAt).toLocaleString()
                        : '—'}
                      {typeof delivery.attemptCount === 'number'
                        ? ` · attempts ${delivery.attemptCount}`
                        : ''}
                    </p>
                    {delivery.lastError ? (
                      <p className="mt-1 [font-family:var(--font-body)] text-xs text-rose-700">
                        {delivery.lastError}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="settings-btn settings-btn--ghost"
                    disabled={replayDeliveryMutation.isPending}
                    onClick={() => void handleReplay(delivery.id)}
                  >
                    Replay
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SettingsCard>
      ) : null}

      <Dialog
        isOpen={Boolean(secretDialogValue)}
        onClose={() => setSecretDialogValue(null)}
        title="Webhook signing secret"
        description="Copy this value now and store it in a secure secret manager. It may not be shown again."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="dialog-action-row flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => void handleCopySecret()}
            >
              {copiedSecret ? 'Copied' : 'Copy secret'}
            </button>
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              onClick={() => setSecretDialogValue(null)}
            >
              I&apos;ve stored it securely
            </button>
          </div>
        }
      >
        {secretDialogValue ? (
          <div className="settings-secret-block settings-secret-block--warn">
            <code className="settings-secret-code">{secretDialogValue}</code>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
