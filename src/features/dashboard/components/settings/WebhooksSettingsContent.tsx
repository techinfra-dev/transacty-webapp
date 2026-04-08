import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import {
  useUpdateWebhookMutation,
  useWebhookQuery,
} from '../../hooks/useWebhookSettings.ts'
import { DEVELOPER_DOCS_URL } from './settingsTabs.ts'
import { SettingsCard } from './SettingsCard.tsx'

export function WebhooksSettingsContent() {
  const [urlDraft, setUrlDraft] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [secretDialogValue, setSecretDialogValue] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isKycPendingVerification =
    profileQuery.data?.kycStatus === 'pending' &&
    profileQuery.data?.businessProfile?.status === 'submitted'
  const webhookQuery = useWebhookQuery(isKycVerified)
  const updateWebhookMutation = useUpdateWebhookMutation()

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

  if (profileQuery.isPending) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center">
        <LoadingSpinner label="Loading profile..." />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="[font-family:var(--font-body)] text-sm text-rose-600">
        Unable to verify KYC status right now.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <section className="flex items-start justify-between gap-3">
        <div>
          <h2 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--color-foreground)">
            Webhooks
          </h2>
          <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Receive HTTPS callbacks for payment and transaction events. Verify
            payloads using your signing secret.
          </p>
        </div>
      </section>

      {!isKycVerified ? (
        <section className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-(--color-accent)/35 bg-(--color-card) p-6 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg viewBox="0 0 20 20" className="h-7 w-7 fill-current" aria-hidden="true">
                <path d="M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 2.75a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
              </svg>
            </div>
            <h3 className="mt-4 [font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
              {isKycPendingVerification
                ? 'KYC pending verification'
                : 'KYC verification required'}
            </h3>
            <p className="mt-2 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
              {isKycPendingVerification
                ? 'Your KYC has been submitted and is currently under review. Webhook configuration will unlock after approval.'
                : 'Complete KYC verification to configure webhook URLs and receive event notifications.'}
            </p>
            {!isKycPendingVerification ? (
              <div className="mt-5 flex flex-col items-center gap-2">
                <Button className="px-5" onClick={openKycDialog}>
                  Complete KYC now
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      ) : webhookQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner label="Loading webhook settings..." />
        </div>
      ) : webhookQuery.isError || !webhookQuery.data ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-3 [font-family:var(--font-body)] text-sm text-rose-700">
          {(webhookQuery.error as Error | undefined)?.message ??
            'Unable to load webhook settings right now.'}
        </section>
      ) : (
        <div className="space-y-4">
          <SettingsCard title="Endpoint URL">
            <p className="[font-family:var(--font-body)] text-sm leading-relaxed text-[#566167]">
              Transacty sends signed POST requests to this URL. Use{' '}
              <a
                href={DEVELOPER_DOCS_URL + '/webhook'}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#0F0700] underline underline-offset-2"
              >
                developer documentation
              </a>{' '}
              for payload shapes and verification steps.
            </p>
            <div className="space-y-2">
              <label
                className="block [font-family:var(--font-body)] text-xs font-semibold text-[#566167]"
                htmlFor="webhook-url-input"
              >
                Webhook URL
              </label>
              <Input
                id="webhook-url-input"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://merchant.com/webhooks/transacty"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                disabled={updateWebhookMutation.isPending}
                className="border-[#D4CFC7] bg-white focus:border-[#0F0700]"
              />
            </div>
            {validationError ? (
              <p className="[font-family:var(--font-body)] text-sm text-rose-600">
                {validationError}
              </p>
            ) : null}
            {mutationError ? (
              <p className="[font-family:var(--font-body)] text-sm text-rose-600">
                {mutationError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-10 px-4 text-xs"
                onClick={() => void handleSave()}
                disabled={updateWebhookMutation.isPending}
                aria-busy={updateWebhookMutation.isPending}
              >
                {updateWebhookMutation.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-(--color-background)/35 border-t-(--color-background)"
                      aria-hidden
                    />
                    Saving…
                  </span>
                ) : (
                  'Save webhook'
                )}
              </Button>
              <Button
                variant="ghost"
                className="h-10 border border-[#D4CFC4] bg-white px-4 text-xs font-semibold text-[#0F0700]! hover:bg-[#FAF8F4]!"
                onClick={() => void handleRemove()}
                disabled={
                  updateWebhookMutation.isPending || !webhookQuery.data.webhookUrl
                }
              >
                Remove webhook
              </Button>
            </div>
            <p className="[font-family:var(--font-body)] text-xs leading-relaxed text-[#566167]">
              When you save a URL, a new signing secret is generated. Store it
              only on your server—never in client-side code or public repos.
            </p>
          </SettingsCard>
        </div>
      )}

      <Dialog
        isOpen={Boolean(secretDialogValue)}
        onClose={() => setSecretDialogValue(null)}
        title="Webhook signing secret"
        description="Copy this value now and store it in a secure secret manager. It may not be shown again."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="dialog-action-row flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-4 text-xs"
              onClick={handleCopySecret}
            >
              {copiedSecret ? 'Copied' : 'Copy secret'}
            </Button>
            <Button
              type="button"
              className="h-10 px-4 text-xs"
              onClick={() => setSecretDialogValue(null)}
            >
              I've stored it securely
            </Button>
          </div>
        }
      >
        {secretDialogValue ? (
          <div className="mt-3 rounded-lg border border-[#E0DCD6] bg-[#FAF8F5] p-3">
            <code className="block break-all font-[ui-monospace,monospace] text-xs text-[#0F0700]">
              {secretDialogValue}
            </code>
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
