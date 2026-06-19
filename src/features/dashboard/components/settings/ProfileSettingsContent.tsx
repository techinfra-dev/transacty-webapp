import { type ReactNode, useEffect, useState } from 'react'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { updateAuthSessionUser } from '../../../auth/services/authSession.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation.ts'
import { SettingsCard } from './SettingsCard.tsx'
import {
  settingsFieldInputClass,
  settingsFieldLabelClass,
} from './settingsFieldUtils.ts'

function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function KycStatusPill({
  children,
  variant,
}: {
  children: ReactNode
  variant: 'success' | 'muted'
}) {
  if (variant === 'success') {
    return <span className="settings-kyc-pill settings-kyc-pill--success">{children}</span>
  }
  return <span className="settings-kyc-pill settings-kyc-pill--muted">{children}</span>
}

export function ProfileSettingsContent() {
  const [isMerchantIdCopied, setIsMerchantIdCopied] = useState(false)
  const [businessNameDraft, setBusinessNameDraft] = useState('')
  const [updateError, setUpdateError] = useState<string | null>(null)
  const profileQuery = useProfileQuery(true)
  const updateProfileMutation = useUpdateProfileMutation()

  useEffect(() => {
    if (profileQuery.data?.businessName) {
      setBusinessNameDraft(profileQuery.data.businessName)
    }
  }, [profileQuery.data?.businessName])

  if (profileQuery.isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading profile…" />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <p className="settings-error">Unable to load profile information right now.</p>
    )
  }

  const profile = profileQuery.data
  // Slug is display/copy only; APIs still use profile.merchantId (UUID).
  const merchantIdDisplay =
    profile.merchantSlug?.trim() || profile.merchantId

  const handleCopyMerchantId = async () => {
    try {
      await navigator.clipboard.writeText(merchantIdDisplay)
      setIsMerchantIdCopied(true)
      window.setTimeout(() => setIsMerchantIdCopied(false), 1800)
    } catch {
      setIsMerchantIdCopied(false)
    }
  }

  const saveBusinessName = async () => {
    const nextBusinessName = businessNameDraft.trim()
    if (!nextBusinessName || nextBusinessName === profile.businessName) {
      setBusinessNameDraft(profile.businessName)
      return
    }

    setUpdateError(null)
    try {
      await updateProfileMutation.mutateAsync({ businessName: nextBusinessName })
      updateAuthSessionUser({ merchantName: nextBusinessName })
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : 'Unable to update business name right now.',
      )
      setBusinessNameDraft(profile.businessName)
    }
  }

  const kycVerified = profile.kycStatus === 'verified'
  const apiKeysPositive = profile.canCreateApiKeys
  const mfaDisabled = !profile.mfaEnabled

  return (
    <div className="settings-profile-layout">
      <div className="settings-profile-main">
        <SettingsCard
          title="Personal information"
          description="Update your business name and review account contact details."
          footer={
            <button
              type="button"
              className="settings-btn settings-btn--primary"
              disabled={updateProfileMutation.isPending}
              onClick={() => void saveBusinessName()}
            >
              {updateProfileMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          }
        >
          <div className="settings-field-grid">
            <label className="settings-field">
              <span className={settingsFieldLabelClass}>Business name</span>
              <Input
                id="settings-business-name"
                value={businessNameDraft}
                onChange={(event) => setBusinessNameDraft(event.target.value)}
                disabled={updateProfileMutation.isPending}
                className={settingsFieldInputClass}
              />
            </label>

            <label className="settings-field">
              <span className={settingsFieldLabelClass}>Email address</span>
              <Input
                readOnly
                value={profile.email}
                tabIndex={-1}
                className={`${settingsFieldInputClass} settings-field-input--readonly`}
              />
            </label>

            <label className="settings-field">
              <span className={settingsFieldLabelClass}>Role</span>
              <Input
                readOnly
                value={profile.role}
                tabIndex={-1}
                className={`${settingsFieldInputClass} settings-field-input--readonly`}
              />
            </label>

            <div className="settings-field settings-field--full">
              <span className={settingsFieldLabelClass}>Merchant ID</span>
              <div className="settings-merchant-row">
                <code className="settings-merchant-id">{merchantIdDisplay}</code>
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={() => void handleCopyMerchantId()}
                >
                  {isMerchantIdCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {updateError ? <p className="settings-error settings-error--inline">{updateError}</p> : null}
        </SettingsCard>

        {profile.businessProfile ? (
          <SettingsCard
            title="Business profile"
            description="Legal and trading information from your KYC submission."
          >
            <div className="settings-field-grid">
              <label className="settings-field">
                <span className={settingsFieldLabelClass}>Business type</span>
                <Input
                  readOnly
                  value={toTitleCaseFromSnake(profile.businessProfile.businessType)}
                  tabIndex={-1}
                  className={`${settingsFieldInputClass} settings-field-input--readonly`}
                />
              </label>
              <label className="settings-field">
                <span className={settingsFieldLabelClass}>Legal name</span>
                <Input
                  readOnly
                  value={profile.businessProfile.legalName}
                  tabIndex={-1}
                  className={`${settingsFieldInputClass} settings-field-input--readonly`}
                />
              </label>
              <label className="settings-field settings-field--full">
                <span className={settingsFieldLabelClass}>Trading name</span>
                <Input
                  readOnly
                  value={profile.businessProfile.tradingName || '—'}
                  tabIndex={-1}
                  className={`${settingsFieldInputClass} settings-field-input--readonly`}
                />
              </label>
            </div>
          </SettingsCard>
        ) : null}
      </div>

      <aside className="settings-profile-aside">
        <SettingsCard
          title="KYC status"
          description="Verification status and account capabilities."
        >
          <div className="settings-kyc-pills">
            <KycStatusPill variant={kycVerified ? 'success' : 'muted'}>
              {profile.kycStatus}
            </KycStatusPill>
            <KycStatusPill variant={apiKeysPositive ? 'success' : 'muted'}>
              API keys {apiKeysPositive ? 'enabled' : 'restricted'}
            </KycStatusPill>
            <KycStatusPill variant={mfaDisabled ? 'muted' : 'success'}>
              MFA {profile.mfaEnabled ? 'enabled' : 'disabled'}
            </KycStatusPill>
          </div>
          <p className="settings-kyc-hint">
            Manage MFA setup and disable actions in the Security tab.
          </p>
        </SettingsCard>
      </aside>
    </div>
  )
}
