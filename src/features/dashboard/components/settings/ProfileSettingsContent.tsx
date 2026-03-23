import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { updateAuthSessionUser } from '../../../auth/services/authSession.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import { useUpdateProfileMutation } from '../../hooks/useUpdateProfileMutation.ts'

function statusClassName(status: 'pending' | 'verified' | 'rejected') {
  if (status === 'verified') {
    return 'bg-emerald-100 text-emerald-700'
  }
  if (status === 'rejected') {
    return 'bg-rose-100 text-rose-700'
  }
  return 'bg-amber-100 text-amber-700'
}

function toTitleCaseFromSnake(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
        {label}
      </p>
      <div className="mt-1.5 rounded-lg border border-(--color-accent)/35 bg-(--color-card) px-3 py-2.5 [font-family:var(--font-body)] text-sm text-(--color-foreground)">
        {value}
      </div>
    </div>
  )
}

export function ProfileSettingsContent() {
  const [isMerchantIdCopied, setIsMerchantIdCopied] = useState(false)
  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false)
  const [businessNameDraft, setBusinessNameDraft] = useState('')
  const [updateError, setUpdateError] = useState<string | null>(null)
  const businessNameInputRef = useRef<HTMLInputElement | null>(null)
  const profileQuery = useProfileQuery(true)
  const updateProfileMutation = useUpdateProfileMutation()

  useEffect(() => {
    if (profileQuery.data?.businessName) {
      setBusinessNameDraft(profileQuery.data.businessName)
    }
  }, [profileQuery.data?.businessName])

  useEffect(() => {
    if (isEditingBusinessName) {
      businessNameInputRef.current?.focus()
      businessNameInputRef.current?.select()
    }
  }, [isEditingBusinessName])

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

  const submitBusinessNameUpdate = async () => {
    const nextBusinessName = businessNameDraft.trim()
    if (!nextBusinessName || nextBusinessName === profile.businessName) {
      setIsEditingBusinessName(false)
      setBusinessNameDraft(profile.businessName)
      return
    }

    setUpdateError(null)
    try {
      await updateProfileMutation.mutateAsync({ businessName: nextBusinessName })
      updateAuthSessionUser({ merchantName: nextBusinessName })
      setIsEditingBusinessName(false)
    } catch (error) {
      setUpdateError(
        error instanceof Error
          ? error.message
          : 'Unable to update business name right now.',
      )
    }
  }

  const handleBusinessNameKeyDown = async (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      await submitBusinessNameUpdate()
      return
    }
    if (event.key === 'Escape') {
      setIsEditingBusinessName(false)
      setBusinessNameDraft(profile.businessName)
    }
  }

  return (
    <div className="space-y-7">
      <section>
        <h3 className="[font-family:var(--font-display)] text-xl font-semibold text-(--color-foreground)">
          Profile
        </h3>
        <p className="mt-1 [font-family:var(--font-body)] text-sm text-(--color-secondary)">
          Personal and business account details.
        </p>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-3">
          <h4 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
            Personal Information
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                Business name
              </p>
              <input
                ref={businessNameInputRef}
                value={businessNameDraft}
                onChange={(event) => setBusinessNameDraft(event.target.value)}
                onBlur={() => {
                  if (isEditingBusinessName && !updateProfileMutation.isPending) {
                    setIsEditingBusinessName(false)
                    setBusinessNameDraft(profile.businessName)
                  }
                }}
                onKeyDown={handleBusinessNameKeyDown}
                disabled={!isEditingBusinessName || updateProfileMutation.isPending}
                className={`mt-1.5 h-11 w-full rounded-lg border border-(--color-accent)/35 px-3 [font-family:var(--font-body)] text-sm text-(--color-foreground) outline-none transition ${
                  isEditingBusinessName
                    ? 'bg-(--color-card) focus:border-(--color-secondary) focus:ring-2 focus:ring-(--color-secondary)/20'
                    : 'bg-(--color-card)/80'
                } ${updateProfileMutation.isPending ? 'opacity-65' : ''}`}
              />
              <button
                type="button"
                className="mt-1 inline-flex cursor-pointer [font-family:var(--font-body)] text-sm text-blue-700 hover:underline"
                onClick={() => {
                  setUpdateError(null)
                  setIsEditingBusinessName(true)
                }}
                disabled={updateProfileMutation.isPending}
              >
                Edit information
              </button>
            </div>
            <ProfileField label="Email address" value={profile.email} />
            <ProfileField label="Role" value={profile.role} />
            <div>
              <p className="[font-family:var(--font-body)] text-sm text-(--color-foreground)">
                Merchant ID
              </p>
              <Button
                variant="ghost"
                className="mt-1.5 h-11 w-full border border-(--color-accent)/45 px-3 text-sm text-(--color-foreground)! hover:bg-(--color-card) hover:text-(--color-foreground)!"
                onClick={handleCopyMerchantId}
              >
                {isMerchantIdCopied ? 'Copied' : 'Copy merchant ID'}
              </Button>
            </div>
          </div>
          {updateError ? (
            <p className="[font-family:var(--font-body)] text-sm text-rose-600">
              {updateError}
            </p>
          ) : null}

          {profile.businessProfile ? (
            <section className="space-y-3 border-t border-(--color-accent)/25 pt-2">
              <h4 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
                Business profile
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField
                  label="Business type"
                  value={toTitleCaseFromSnake(profile.businessProfile.businessType)}
                />
                <ProfileField
                  label="Legal name"
                  value={profile.businessProfile.legalName}
                />
                {profile.businessProfile.tradingName ? (
                  <ProfileField
                    label="Trading name"
                    value={profile.businessProfile.tradingName}
                  />
                ) : null}
              </div>
            </section>
          ) : null}
        </section>

        <section className="space-y-3">
          <h4 className="[font-family:var(--font-display)] text-lg font-semibold text-(--color-foreground)">
            KYC Status
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 [font-family:var(--font-body)] text-sm font-semibold ${statusClassName(
                profile.kycStatus,
              )}`}
            >
              {profile.kycStatus}
            </span>
            <span className="inline-flex rounded-full bg-(--color-accent)/20 px-2.5 py-1 [font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
              API keys {profile.canCreateApiKeys ? 'enabled' : 'restricted'}
            </span>
            <span className="inline-flex rounded-full bg-(--color-accent)/20 px-2.5 py-1 [font-family:var(--font-body)] text-sm font-semibold text-(--color-foreground)">
              MFA {profile.mfaEnabled ? 'enabled' : 'disabled'}
            </span>
          </div>
          <p className="[font-family:var(--font-body)] text-xs text-(--color-secondary)">
            Manage MFA setup and disable actions in the Security tab.
          </p>
        </section>
      </section>
    </div>
  )
}
