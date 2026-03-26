import { type ReactNode, useEffect, useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { Input } from '../../../../components/ui/Input.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { updateAuthSessionUser } from '../../../auth/services/authSession.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation.ts'
import { SettingsCard } from './SettingsCard.tsx'

function fieldLabelClass() {
  return '[font-family:var(--font-body)] text-xs font-semibold text-[#566167]'
}

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
  const base =
    'inline-flex rounded-full px-2.5 py-1 [font-family:var(--font-body)] text-xs font-semibold capitalize'
  if (variant === 'success') {
    return (
      <span className={`${base} bg-[#3D6B4F] text-white`}>{children}</span>
    )
  }
  return <span className={`${base} bg-[#9D8F82] text-white`}>{children}</span>
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
      <div className="flex min-h-[320px] items-center justify-center py-12">
        <LoadingSpinner label="Loading profile..." />
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="[font-family:var(--font-body)] text-sm text-rose-600">
        Unable to load profile information right now.
      </div>
    )
  }

  const profile = profileQuery.data

  const handleCopyMerchantId = async () => {
    try {
      await navigator.clipboard.writeText(profile.merchantId)
      setIsMerchantIdCopied(true)
      window.setTimeout(() => setIsMerchantIdCopied(false), 1800)
    } catch {
      setIsMerchantIdCopied(false)
    }
  }

  const saveBusinessNameIfChanged = async () => {
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
    <div className="space-y-6">
      <h1 className="[font-family:var(--font-display)] text-2xl font-semibold tracking-tight text-[#0F0700] md:text-3xl">
        Profile
      </h1>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <SettingsCard title="Personal Information">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className={fieldLabelClass()} htmlFor="settings-business-name">
                  Business name
                </label>
                <Input
                  id="settings-business-name"
                  value={businessNameDraft}
                  onChange={(event) => setBusinessNameDraft(event.target.value)}
                  onBlur={() => {
                    void saveBusinessNameIfChanged()
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }
                  }}
                  disabled={updateProfileMutation.isPending}
                  className="mt-1.5 border-[#D4CFC7] bg-white focus:border-[#0F0700]"
                />
              </div>

              <div>
                <p className={fieldLabelClass()}>Email address</p>
                <Input
                  readOnly
                  value={profile.email}
                  tabIndex={-1}
                  className="mt-1.5 cursor-default border-[#D4CFC7] bg-white"
                />
              </div>

              <div>
                <p className={fieldLabelClass()}>Role</p>
                <Input
                  readOnly
                  value={profile.role}
                  tabIndex={-1}
                  className="mt-1.5 cursor-default border-[#E8E4DE] bg-[#ECEAE8] text-[#464644]"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <p className={`shrink-0 ${fieldLabelClass()}`}>Merchant ID</p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-full shrink-0 rounded-lg border border-[#D4CFC7] bg-white px-4 text-sm font-semibold text-[#0F0700]! hover:bg-[#F7F4EF] sm:w-auto"
                    onClick={handleCopyMerchantId}
                  >
                    {isMerchantIdCopied ? 'Copied' : 'Copy merchant ID'}
                  </Button>
                </div>
              </div>
            </div>

            {updateError ? (
              <p className="[font-family:var(--font-body)] text-sm text-rose-600">
                {updateError}
              </p>
            ) : null}
          </SettingsCard>

          {profile.businessProfile ? (
            <SettingsCard title="Business profile">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className={fieldLabelClass()}>Business type</p>
                  <Input
                    readOnly
                    value={toTitleCaseFromSnake(profile.businessProfile.businessType)}
                    tabIndex={-1}
                    className="mt-1.5 cursor-default border-[#D4CFC7] bg-white"
                  />
                </div>
                <div>
                  <p className={fieldLabelClass()}>Legal name</p>
                  <Input
                    readOnly
                    value={profile.businessProfile.legalName}
                    tabIndex={-1}
                    className="mt-1.5 cursor-default border-[#D4CFC7] bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className={fieldLabelClass()}>Trading name</p>
                  <Input
                    readOnly
                    value={profile.businessProfile.tradingName || '—'}
                    tabIndex={-1}
                    className="mt-1.5 cursor-default border-[#D4CFC7] bg-white"
                  />
                </div>
              </div>
            </SettingsCard>
          ) : null}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-4">
          <div className="overflow-hidden rounded-lg border border-[#E0DCD6] bg-[#FAF8F5] shadow-[0_1px_2px_rgba(15,7,0,0.04)]">
            <div className="border-b border-[#E8E2DA] bg-[#F3E8D6] px-4 py-2.5">
              <h3 className="[font-family:var(--font-display)] text-sm font-semibold text-[#0F0700]">
                KYC Status
              </h3>
            </div>
            <div className="space-y-3 p-4 md:p-5">
              <div className="flex flex-wrap gap-2">
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
              <p className="[font-family:var(--font-body)] text-xs leading-relaxed text-[#566167]">
                Manage MFA setup and disable actions in the Security tab.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
