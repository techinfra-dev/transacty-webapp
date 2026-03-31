import { useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import {
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from '../../hooks/useApiKeysQuery.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import type {
  ApiKeyEnvironment,
  ApiKeyItem,
  CreateApiKeyResponse,
} from '../../services/apiKeysSchemas.ts'

function formatCreatedAt(isoDate: string) {
  const timestamp = new Date(isoDate)
  if (Number.isNaN(timestamp.getTime())) {
    return isoDate
  }
  return timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatScopeLabel(scope: string) {
  if (scope === '*') {
    return 'All'
  }
  return scope.replace(':', ' · ')
}

function parseScopes(scopes: string) {
  return scopes
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean)
}

export function ApiKeysSettingsContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<ApiKeyEnvironment>('test')
  const [createdApiKey, setCreatedApiKey] = useState<CreateApiKeyResponse | null>(null)
  const [copiedField, setCopiedField] = useState<'apiKey' | 'secret' | null>(null)
  const [keyForRevoke, setKeyForRevoke] = useState<ApiKeyItem | null>(null)
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isKycPendingVerification =
    profileQuery.data?.kycStatus === 'pending' &&
    profileQuery.data?.businessProfile?.status === 'submitted'
  const apiKeysQuery = useApiKeysQuery(isKycVerified)
  const createApiKeyMutation = useCreateApiKeyMutation()
  const revokeApiKeyMutation = useRevokeApiKeyMutation()
  async function handleConfirmRevoke() {
    if (!keyForRevoke) {
      return
    }
    try {
      await revokeApiKeyMutation.mutateAsync(keyForRevoke.id)
      setKeyForRevoke(null)
    } catch {
      // Error shown inline in dialog
    }
  }

  const environmentOptions = [
    { value: 'test', label: 'Test' },
    { value: 'live', label: 'Live' },
  ]

  async function handleCopyValue(
    value: string,
    field: 'apiKey' | 'secret',
  ) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 1500)
    } catch {
      setCopiedField(null)
    }
  }

  async function handleCreateApiKey() {
    try {
      const response = await createApiKeyMutation.mutateAsync({
        environment: selectedEnvironment,
      })
      setCreatedApiKey(response)
      setIsCreateDialogOpen(false)
    } catch {
      // Error shown inline
    }
  }

  if (profileQuery.isPending) {
    return (
      <div className="flex h-full min-h-[260px] items-center justify-center">
        <LoadingSpinner label="Loading API keys..." />
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
            API keys
          </h2>
          <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
            Manage your generated API keys for backend integration.
          </p>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 [font-family:var(--font-body)] text-xs leading-snug text-amber-950">
            <p className="font-semibold text-amber-900">Using test vs live keys</p>
            <p className="mt-1 text-amber-900/90">
              Create and store two keys: one with environment{' '}
              <span className="font-semibold">test</span> (sandbox and test wallet
              history) and one with{' '}
              <span className="font-semibold">live</span> (production and live wallet
              history). Match the key to the environment you are calling.
            </p>
          </div>
        </div>
        {isKycVerified ? (
          <Button
            className="h-10 px-3 text-xs"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create API key
          </Button>
        ) : null}
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
                ? 'Your KYC has been submitted and is currently under review. API key management will unlock after approval.'
                : 'Upload and submit your KYC details to unlock API key management for your account.'}
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
      ) : apiKeysQuery.isPending ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingSpinner label="Loading API keys..." />
        </div>
      ) : apiKeysQuery.isError || !apiKeysQuery.data ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-3 [font-family:var(--font-body)] text-sm text-rose-700">
          {(apiKeysQuery.error as Error | undefined)?.message ??
            'Unable to load API keys right now.'}
        </section>
      ) : apiKeysQuery.data.items.length === 0 ? (
        <section className="rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-3 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          No API keys found for this workspace.
        </section>
      ) : (
        <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-(--color-accent)/35 bg-(--color-card)">
          <div className="grid grid-cols-[1.2fr_0.8fr_1.6fr_0.8fr_1fr_56px] gap-2 border-b border-(--color-accent)/35 px-3 py-2 [font-family:var(--font-body)] text-[11px] uppercase tracking-wide text-(--color-secondary)">
            <p>Key</p>
            <p>Env</p>
            <p>Scopes</p>
            <p>Status</p>
            <p>Created</p>
            <p className="text-right">Action</p>
          </div>
          <div className="max-h-full overflow-y-auto">
            {apiKeysQuery.data.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.2fr_0.8fr_1.6fr_0.8fr_1fr_56px] gap-2 border-b border-(--color-accent)/20 px-3 py-2.5 [font-family:var(--font-body)] text-sm text-(--color-foreground) last:border-b-0"
              >
                <p className="truncate">{item.keyMasked}</p>
                <p>{item.environment}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {parseScopes(item.scopes)
                    .slice(0, 3)
                    .map((scope) => (
                      <span
                        key={`${item.id}-${scope}`}
                        className="inline-flex rounded-full border border-(--color-accent)/35 bg-(--color-background) px-2 py-0.5 [font-family:var(--font-body)] text-[11px] text-(--color-secondary)"
                      >
                        {formatScopeLabel(scope)}
                      </span>
                    ))}
                </div>
                <p>{item.status}</p>
                <p className="text-xs text-(--color-secondary)">
                  {formatCreatedAt(item.createdAt)}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    aria-label="Revoke API key"
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-rose-300 bg-rose-50 text-rose-600 transition hover:border-rose-400 hover:bg-rose-100 hover:text-rose-700"
                    onClick={() => setKeyForRevoke(item)}
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                      <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={() => {
          if (!createApiKeyMutation.isPending) {
            setIsCreateDialogOpen(false)
          }
        }}
        title="Create API key"
        description="Choose environment and generate a new key pair."
        maxWidthClassName="max-w-md min-h-[420px]"
        contentClassName="overflow-visible"
        allowOverflow
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="px-4"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createApiKeyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="px-4"
              onClick={handleCreateApiKey}
              disabled={createApiKeyMutation.isPending}
            >
              {createApiKeyMutation.isPending ? 'Creating...' : 'Create key'}
            </Button>
          </div>
        }
      >
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--color-secondary)">
            Environment
          </span>
          <DropdownSelect
            ariaLabel="Select key environment"
            options={environmentOptions}
            value={selectedEnvironment}
            onChange={(value) => setSelectedEnvironment(value as ApiKeyEnvironment)}
            className="w-full"
          />
        </label>
        {createApiKeyMutation.isError ? (
          <p className="mt-3 [font-family:var(--font-body)] text-sm text-rose-600">
            {createApiKeyMutation.error.message}
          </p>
        ) : null}
      </Dialog>

      <Dialog
        isOpen={Boolean(createdApiKey)}
        onClose={() => setCreatedApiKey(null)}
        title="API key created"
        description="Save the secret securely. It will not be shown again."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex items-center justify-end">
            <Button variant="ghost" className="px-4" onClick={() => setCreatedApiKey(null)}>
              Done
            </Button>
          </div>
        }
      >
        {createdApiKey ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-(--color-accent)/35 bg-(--color-card) p-3">
              <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
                API key
              </p>
              <p className="mt-1 break-all [font-family:var(--font-body)] text-sm text-(--color-foreground)">
                {createdApiKey.apiKey}
              </p>
              <div className="mt-2">
                <Button
                  variant="ghost"
                  className="h-8 border border-(--color-accent)/45 px-2 text-xs"
                  onClick={() => handleCopyValue(createdApiKey.apiKey, 'apiKey')}
                >
                  {copiedField === 'apiKey' ? 'Copied' : 'Copy API key'}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="[font-family:var(--font-body)] text-xs text-amber-700">
                Secret (shown once)
              </p>
              <p className="mt-1 break-all [font-family:var(--font-body)] text-sm text-amber-900">
                {createdApiKey.secret}
              </p>
              <div className="mt-2">
                <Button
                  variant="ghost"
                  className="h-8 border border-amber-300 px-2 text-xs text-amber-800 hover:text-amber-900"
                  onClick={() => handleCopyValue(createdApiKey.secret, 'secret')}
                >
                  {copiedField === 'secret' ? 'Copied' : 'Copy secret'}
                </Button>
              </div>
            </div>

            <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
              {createdApiKey.environment === 'live' ? 'Live' : 'Test'}
            </p>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        isOpen={Boolean(keyForRevoke)}
        onClose={() => {
          if (!revokeApiKeyMutation.isPending) {
            setKeyForRevoke(null)
          }
        }}
        title="Revoke API key"
        description="This key will stop working immediately."
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              className="px-4"
              onClick={() => setKeyForRevoke(null)}
              disabled={revokeApiKeyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="px-4"
              onClick={handleConfirmRevoke}
              disabled={revokeApiKeyMutation.isPending}
            >
              {revokeApiKeyMutation.isPending ? 'Revoking...' : 'Revoke key'}
            </Button>
          </div>
        }
      >
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Are you sure you want to revoke this API key?
        </p>
        {keyForRevoke ? (
          <p className="mt-2 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
            {keyForRevoke.keyMasked}
          </p>
        ) : null}
        {revokeApiKeyMutation.isError ? (
          <p className="mt-3 [font-family:var(--font-body)] text-sm text-rose-600">
            {revokeApiKeyMutation.error.message}
          </p>
        ) : null}
      </Dialog>
    </div>
  )
}
