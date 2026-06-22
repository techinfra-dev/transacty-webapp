import { useEffect, useState } from 'react'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch.tsx'
import { DropdownSelect } from '../../../../components/ui/DropdownSelect.tsx'
import { useKycDialogStore } from '../../../../store/kycDialogStore.ts'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import {
  useApiIpRulesQuery,
  useUpdateApiIpRulesMutation,
} from '../../hooks/useApiIpRulesQuery.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import type { ApiIpEnforceMode } from '../../services/apiIpRulesSchemas.ts'
import {
  dedupeCidrs,
  isValidIpv4OrCidr,
  normalizeCidrEntry,
} from '../../utils/apiIpRulesUtils.ts'
import { SettingsCard } from './SettingsCard.tsx'
import { SettingsKycGate } from './SettingsKycGate.tsx'
import {
  settingsFieldInputClass,
  settingsFieldLabelClass,
} from './settingsFieldUtils.ts'

const enforceModeOptions = [
  {
    value: 'strict',
    label: 'Strict — block requests from other IPs',
  },
  {
    value: 'log_only',
    label: 'Log only — allow but log non-allowlisted IPs',
  },
]

export function WhitelistedIpSettingsContent() {
  const openKycDialog = useKycDialogStore((state) => state.openDialog)
  const portalEnvironment = usePortalEnvironmentStore((state) => state.environment)
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const isKycPendingVerification =
    profileQuery.data?.kycStatus === 'pending' &&
    profileQuery.data?.businessProfile?.status === 'submitted'

  const rulesQuery = useApiIpRulesQuery(isKycVerified)
  const updateRulesMutation = useUpdateApiIpRulesMutation()

  const [enabled, setEnabled] = useState(false)
  const [enforceMode, setEnforceMode] = useState<ApiIpEnforceMode>('strict')
  const [cidrs, setCidrs] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [newCidr, setNewCidr] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  useEffect(() => {
    if (!rulesQuery.data) {
      return
    }
    setEnabled(rulesQuery.data.enabled)
    setEnforceMode(rulesQuery.data.enforceMode)
    setCidrs(rulesQuery.data.cidrs)
    setNotes(rulesQuery.data.notes?.trim() ?? '')
  }, [rulesQuery.data])

  function handleAddCidr() {
    setValidationError(null)
    const normalized = normalizeCidrEntry(newCidr)
    if (!normalized) {
      return
    }
    if (!isValidIpv4OrCidr(normalized)) {
      setValidationError('Enter a valid IPv4 address or CIDR (e.g. 203.0.113.10 or 203.0.113.0/24).')
      return
    }
    setCidrs((current) => dedupeCidrs([...current, normalized]))
    setNewCidr('')
  }

  function handleRemoveCidr(entry: string) {
    setCidrs((current) => current.filter((value) => value !== entry))
  }

  function handleAddClientIp() {
    const clientIp = rulesQuery.data?.clientIp?.trim()
    if (!clientIp) {
      return
    }
    setCidrs((current) => dedupeCidrs([...current, clientIp]))
  }

  async function handleSave() {
    setValidationError(null)
    setMutationError(null)

    const normalizedCidrs = dedupeCidrs(cidrs)
    if (enabled && normalizedCidrs.length === 0) {
      setValidationError('Add at least one IP or CIDR before enabling the allowlist.')
      return
    }

    try {
      await updateRulesMutation.mutateAsync({
        enabled,
        enforceMode,
        cidrs: normalizedCidrs,
        notes: notes.trim() || undefined,
      })
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : 'Unable to save API IP allowlist right now.',
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
              ? 'Your KYC has been submitted and is currently under review. API IP allowlist management will unlock after approval.'
              : 'Complete KYC verification to manage which IPs can call the merchant API (/v1/*).'
          }
          showCta={!isKycPendingVerification}
          onCta={openKycDialog}
        />
      ) : rulesQuery.isPending ? (
        <div className="settings-loading">
          <LoadingSpinner label="Loading IP allowlist…" />
        </div>
      ) : rulesQuery.isError || !rulesQuery.data ? (
        <p className="settings-dev-alert">
          {(rulesQuery.error as Error | undefined)?.message ??
            'Unable to load API IP allowlist right now.'}
        </p>
      ) : (
        <>
          <SettingsCard
            title="Your current IP"
            description="Use this address when testing HMAC API calls from your current network."
          >
            <div className="settings-ip-current-row">
              <code className="settings-ip-current-value">
                {rulesQuery.data.clientIp ?? 'Unavailable'}
              </code>
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={handleAddClientIp}
                disabled={!rulesQuery.data.clientIp || updateRulesMutation.isPending}
              >
                Add to allowlist
              </button>
            </div>
            <p className="settings-hint">
              Environment: {portalEnvironment === 'live' ? 'Live' : 'Test'}
            </p>
          </SettingsCard>

          <SettingsCard
            title="Merchant API allowlist"
            description="Controls which origin IPs can call /v1/* after HMAC authentication."
            footer={
              <div className="settings-dev-actions-row">
                <button
                  type="button"
                  className="settings-btn settings-btn--primary"
                  onClick={() => void handleSave()}
                  disabled={updateRulesMutation.isPending}
                  aria-busy={updateRulesMutation.isPending}
                >
                  {updateRulesMutation.isPending ? 'Saving…' : 'Save allowlist'}
                </button>
              </div>
            }
          >
            <div className="settings-ip-toggle-row">
              <div>
                <p className={settingsFieldLabelClass}>Enable allowlist</p>
                <p className="settings-hint">
                  When disabled, all IPs are allowed for merchant API requests.
                </p>
              </div>
              <ToggleSwitch
                checked={enabled}
                onCheckedChange={setEnabled}
                ariaLabel="Enable API IP allowlist"
                disabled={updateRulesMutation.isPending}
              />
            </div>

            <label className="settings-field settings-field--full">
              <span className={settingsFieldLabelClass}>Enforcement mode</span>
              <DropdownSelect
                ariaLabel="Select enforcement mode"
                options={enforceModeOptions}
                value={enforceMode}
                onChange={(value) => setEnforceMode(value as ApiIpEnforceMode)}
                className="mt-1.5 w-full max-w-md"
                disabled={updateRulesMutation.isPending}
              />
            </label>

            <div className="settings-field settings-field--full">
              <span className={settingsFieldLabelClass}>Allowed IPs and CIDRs</span>
              {cidrs.length > 0 ? (
                <ul className="settings-ip-chip-list">
                  {cidrs.map((entry) => (
                    <li key={entry} className="settings-ip-chip">
                      <code>{entry}</code>
                      <button
                        type="button"
                        className="settings-ip-chip-remove"
                        aria-label={`Remove ${entry}`}
                        onClick={() => handleRemoveCidr(entry)}
                        disabled={updateRulesMutation.isPending}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="settings-hint">No addresses added yet.</p>
              )}

              <div className="settings-ip-add-row">
                <Input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="203.0.113.10 or 203.0.113.0/24"
                  value={newCidr}
                  onChange={(event) => setNewCidr(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddCidr()
                    }
                  }}
                  disabled={updateRulesMutation.isPending}
                  className={settingsFieldInputClass}
                />
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={handleAddCidr}
                  disabled={updateRulesMutation.isPending || !newCidr.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            <label className="settings-field settings-field--full">
              <span className={settingsFieldLabelClass}>Notes (optional)</span>
              <Input
                type="text"
                placeholder="Office + VPN"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={updateRulesMutation.isPending}
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
              Changes take effect within about 30 seconds. In strict mode, requests from
              non-allowlisted IPs receive{' '}
              <code className="settings-inline-code">403 ip_not_allowed</code>.
            </p>
          </SettingsCard>
        </>
      )}
    </div>
  )
}
