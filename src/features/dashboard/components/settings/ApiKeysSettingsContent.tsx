import { useMemo, useState } from 'react'
import { Dialog } from '../../../../components/ui/Dialog.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { usePortalRole } from '../../../../hooks/usePortalRole.ts'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import {
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} from '../../hooks/useApiKeysQuery.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import {
  API_KEY_SCOPE_OPTIONS,
  normalizeApiKeyScopes,
  type ApiKeyItem,
  type ApiKeyScope,
  type CreateApiKeyResponse,
} from '../../services/apiKeysSchemas.ts'
import { SettingsKycGate } from './SettingsKycGate.tsx'
import { settingsFieldLabelClass } from './settingsFieldUtils.ts'

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

export function ApiKeysSettingsContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLiveConfirmOpen, setIsLiveConfirmOpen] = useState(false)
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>([])
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdApiKey, setCreatedApiKey] = useState<CreateApiKeyResponse | null>(null)
  const [copiedField, setCopiedField] = useState<'apiKey' | 'secret' | null>(null)
  const [keyForRevoke, setKeyForRevoke] = useState<ApiKeyItem | null>(null)
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const { isAdmin } = usePortalRole()
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isKycPendingVerification =
    profileQuery.data?.kycStatus === 'pending' &&
    profileQuery.data?.businessProfile?.status === 'submitted'
  const apiKeysQuery = useApiKeysQuery(isKycVerified && isAdmin)
  const createApiKeyMutation = useCreateApiKeyMutation()
  const revokeApiKeyMutation = useRevokeApiKeyMutation()

  const hasWildcard = selectedScopes.includes('*')
  const selectedScopeSet = useMemo(() => new Set(selectedScopes), [selectedScopes])

  function openCreateDialog() {
    setSelectedScopes([])
    setCreateError(null)
    setIsCreateOpen(true)
  }

  function closeCreateDialog() {
    if (createApiKeyMutation.isPending) {
      return
    }
    setIsCreateOpen(false)
    setCreateError(null)
  }

  function toggleScope(scope: ApiKeyScope) {
    setCreateError(null)
    setSelectedScopes((current) => {
      if (scope === '*') {
        return current.includes('*') ? [] : ['*']
      }
      const withoutWildcard = current.filter((value) => value !== '*')
      if (withoutWildcard.includes(scope)) {
        return withoutWildcard.filter((value) => value !== scope)
      }
      return [...withoutWildcard, scope]
    })
  }

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

  async function handleCopyValue(value: string, field: 'apiKey' | 'secret') {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 1500)
    } catch {
      setCopiedField(null)
    }
  }

  async function executeCreateApiKey() {
    setCreateError(null)
    try {
      const response = await createApiKeyMutation.mutateAsync({
        environment: portalEnvironment,
        ...(selectedScopes.length > 0 ? { scopes: selectedScopes } : {}),
      })
      setIsLiveConfirmOpen(false)
      setIsCreateOpen(false)
      setCreatedApiKey(response)
    } catch (error) {
      setIsLiveConfirmOpen(false)
      setCreateError(
        error instanceof Error
          ? error.message
          : 'Unable to create API key right now.',
      )
    }
  }

  async function handleCreateApiKey() {
    if (portalEnvironment === 'live') {
      setIsLiveConfirmOpen(true)
      return
    }
    await executeCreateApiKey()
  }

  if (profileQuery.isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading API keys…" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <p className="settings-error">Unable to verify KYC status right now.</p>
  }

  if (!isAdmin) {
    return (
      <p className="settings-dev-alert">
        Admin role required to manage API keys.
      </p>
    )
  }

  return (
    <div className="settings-stack">
      {isKycVerified ? (
        <div className="settings-toolbar">
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            onClick={openCreateDialog}
            disabled={createApiKeyMutation.isPending}
          >
            Create API key
          </button>
        </div>
      ) : null}

      {!isKycVerified ? (
        <SettingsKycGate
          title={
            isKycPendingVerification
              ? 'KYC pending verification'
              : 'KYC verification required'
          }
          description={
            isKycPendingVerification
              ? 'Your KYC has been submitted and is currently under review. API key management will unlock after approval.'
              : 'Upload and submit your KYC details to unlock API key management for your account.'
          }
          showCta={!isKycPendingVerification}
          onCta={openKycDialog}
        />
      ) : apiKeysQuery.isPending ? (
        <div className="settings-loading">
          <LoadingSpinner label="Loading API keys…" />
        </div>
      ) : apiKeysQuery.isError || !apiKeysQuery.data ? (
        <p className="settings-dev-alert">
          {(apiKeysQuery.error as Error | undefined)?.message ??
            'Unable to load API keys right now.'}
        </p>
      ) : apiKeysQuery.data.items.length === 0 ? (
        <article className="settings-card">
          <p className="settings-dev-empty">No API keys found for this workspace.</p>
        </article>
      ) : (
        <article className="settings-card settings-dev-table-card">
          <div className="settings-dev-table-head">
            <p>Key</p>
            <p>Env</p>
            <p>Scopes</p>
            <p>Status</p>
            <p>Created</p>
            <p>Action</p>
          </div>
          <div className="settings-dev-table-body">
            {apiKeysQuery.data.items.map((item) => {
              const isRevoked = item.status.toLowerCase() === 'revoked'
              return (
                <div key={item.id} className="settings-dev-table-row">
                  <p className="truncate">{item.keyMasked}</p>
                  <p className="settings-dev-table-muted">{item.environment}</p>
                  <div className="settings-dev-scope-list">
                    {normalizeApiKeyScopes(item.scopes)
                      .slice(0, 3)
                      .map((scope) => (
                        <span key={`${item.id}-${scope}`} className="settings-dev-scope-tag">
                          {formatScopeLabel(scope)}
                        </span>
                      ))}
                  </div>
                  <p
                    className={`settings-dev-status ${isRevoked ? 'settings-dev-status--revoked' : 'settings-dev-status--active'}`}
                  >
                    {item.status}
                  </p>
                  <p className="settings-dev-table-muted">{formatCreatedAt(item.createdAt)}</p>
                  <div className="settings-dev-actions">
                    {isRevoked ? null : (
                      <button
                        type="button"
                        aria-label="Revoke API key"
                        className="settings-dev-revoke-btn"
                        onClick={() => setKeyForRevoke(item)}
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3.5 w-3.5 fill-current"
                          aria-hidden
                        >
                          <path d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      )}

      <Dialog
        isOpen={isCreateOpen}
        onClose={closeCreateDialog}
        title="Create API key"
        description={`Keys are created in the ${portalEnvironment === 'live' ? 'live' : 'test'} environment. Prefer least privilege — avoid * in production.`}
        maxWidthClassName="max-w-lg"
        footer={
          <div className="settings-dev-actions-row">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={closeCreateDialog}
              disabled={createApiKeyMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              onClick={() => void handleCreateApiKey()}
              disabled={createApiKeyMutation.isPending}
              aria-busy={createApiKeyMutation.isPending}
            >
              {createApiKeyMutation.isPending ? 'Creating…' : 'Create key'}
            </button>
          </div>
        }
      >
        <div className="settings-stack">
          <div>
            <p className={settingsFieldLabelClass}>Scopes</p>
            <p className="settings-hint mt-1">
              Optional. Leave all unchecked to use the server default scopes.
            </p>
            <div className="settings-scope-toggle-list" role="group" aria-label="API key scopes">
              {API_KEY_SCOPE_OPTIONS.map((option) => {
                const checked = selectedScopeSet.has(option.value)
                const disabled = hasWildcard && option.value !== '*'
                return (
                  <label
                    key={option.value}
                    className={`settings-scope-toggle ${checked ? 'settings-scope-toggle--on' : ''} ${disabled ? 'settings-scope-toggle--disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleScope(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                )
              })}
            </div>
            {portalEnvironment === 'live' && hasWildcard ? (
              <p className="settings-hint settings-hint--warn mt-2">
                Wildcard (*) grants full access. Prefer specific scopes in live.
              </p>
            ) : null}
          </div>
          {createError ? (
            <p className="settings-error settings-error--inline">{createError}</p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        isOpen={isLiveConfirmOpen}
        onClose={() => {
          if (!createApiKeyMutation.isPending) {
            setIsLiveConfirmOpen(false)
          }
        }}
        title="Create live API key?"
        description="Creating a live key revokes any previous live API key for this merchant. Continue only if you are ready to rotate integrations."
        maxWidthClassName="max-w-md"
        closeOnBackdrop={!createApiKeyMutation.isPending}
        footer={
          <div className="settings-dev-actions-row">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => setIsLiveConfirmOpen(false)}
              disabled={createApiKeyMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              onClick={() => void executeCreateApiKey()}
              disabled={createApiKeyMutation.isPending}
              aria-busy={createApiKeyMutation.isPending}
            >
              {createApiKeyMutation.isPending ? 'Creating…' : 'Create live key'}
            </button>
          </div>
        }
      >
        <p className="settings-hint">
          Store the new secret securely. It will only be shown once.
        </p>
      </Dialog>

      <Dialog
        isOpen={Boolean(createdApiKey)}
        onClose={() => setCreatedApiKey(null)}
        title="API key created"
        description="Save the secret securely. It will not be shown again."
        maxWidthClassName="max-w-lg"
        footer={
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => setCreatedApiKey(null)}
            >
              Done
            </button>
          </div>
        }
      >
        {createdApiKey ? (
          <div className="settings-stack">
            <div className="settings-secret-block">
              <p className={settingsFieldLabelClass}>API key</p>
              <code className="settings-secret-code">{createdApiKey.apiKey}</code>
              <div className="mt-3">
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={() => void handleCopyValue(createdApiKey.apiKey, 'apiKey')}
                >
                  {copiedField === 'apiKey' ? 'Copied' : 'Copy API key'}
                </button>
              </div>
            </div>

            <div className="settings-secret-block settings-secret-block--warn">
              <p className={settingsFieldLabelClass}>Secret (shown once)</p>
              <code className="settings-secret-code">{createdApiKey.secret}</code>
              <div className="mt-3">
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={() => void handleCopyValue(createdApiKey.secret, 'secret')}
                >
                  {copiedField === 'secret' ? 'Copied' : 'Copy secret'}
                </button>
              </div>
            </div>

            <p className="settings-hint">
              Environment: {createdApiKey.environment === 'live' ? 'Live' : 'Test'}
            </p>
            <div className="settings-dev-scope-list">
              {normalizeApiKeyScopes(createdApiKey.scopes).map((scope) => (
                <span key={scope} className="settings-dev-scope-tag">
                  {formatScopeLabel(scope)}
                </span>
              ))}
            </div>
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
          <div className="settings-dev-actions-row">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={() => setKeyForRevoke(null)}
              disabled={revokeApiKeyMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              onClick={() => void handleConfirmRevoke()}
              disabled={revokeApiKeyMutation.isPending}
              aria-busy={revokeApiKeyMutation.isPending}
            >
              {revokeApiKeyMutation.isPending ? 'Revoking…' : 'Revoke key'}
            </button>
          </div>
        }
      >
        <p className="settings-hint">Are you sure you want to revoke this API key?</p>
        {keyForRevoke ? (
          <p className="settings-secret-code mt-2">
            {keyForRevoke.keyMasked}
          </p>
        ) : null}
        {revokeApiKeyMutation.isError ? (
          <p className="settings-error settings-error--inline">{revokeApiKeyMutation.error.message}</p>
        ) : null}
      </Dialog>
    </div>
  )
}
