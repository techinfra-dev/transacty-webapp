import { useState } from 'react'
import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { usePortalEnvironmentStore } from '../../../../store/portalEnvironmentStore.ts'
import { useProfileQuery } from '../../hooks/useProfileQuery.ts'
import {
  useCreateNuvionEntityMutation,
  useNuvionEntityQuery,
} from '../../hooks/useNuvionEntity.ts'
import {
  formatNuvionEntityStatus,
  isNuvionEntityApproved,
  isNuvionEntityPending,
  isNuvionEntityTerminalFailure,
  NUVION_ENTITY_APPROVED_COPY,
  NUVION_ONBOARDING_COPY,
  nuvionEnvironmentLabel,
} from '../../utils/nuvionMarket.ts'
import { NuvionEntitySetupForm } from '../NuvionEntitySetupForm.tsx'
import { SettingsCard } from './SettingsCard.tsx'

function statusPillClass(status: string | null | undefined) {
  if (isNuvionEntityApproved(status)) {
    return 'dashboard-pill dashboard-pill-neutral'
  }
  if (isNuvionEntityPending(status)) {
    return 'dashboard-pill dashboard-pill-neutral'
  }
  if (isNuvionEntityTerminalFailure(status)) {
    return 'dashboard-pill bg-rose-100 text-rose-800'
  }
  return 'dashboard-pill dashboard-pill-neutral'
}

export function NuvionGetStartedCard() {
  const environment = usePortalEnvironmentStore((state) => state.environment)
  const profileQuery = useProfileQuery(true)
  const isKycVerified = profileQuery.data?.kycStatus === 'verified'
  const entityQuery = useNuvionEntityQuery(isKycVerified)
  const createMutation = useCreateNuvionEntityMutation()
  const [showForm, setShowForm] = useState(false)

  if (!isKycVerified) {
    return null
  }

  if (entityQuery.isPending) {
    return (
      <SettingsCard title="Nuvion" description={NUVION_ONBOARDING_COPY}>
        <div className="flex min-h-[80px] items-center justify-center">
          <LoadingSpinner label="Checking Nuvion entity…" />
        </div>
      </SettingsCard>
    )
  }

  if (entityQuery.isError) {
    return (
      <SettingsCard title="Nuvion" description={NUVION_ONBOARDING_COPY}>
        <p className="settings-error settings-error--inline">
          {entityQuery.error instanceof Error
            ? entityQuery.error.message
            : 'Unable to load Nuvion entity status.'}
        </p>
      </SettingsCard>
    )
  }

  const entity = entityQuery.data
  const status = entity?.status

  if (entity && isNuvionEntityApproved(status)) {
    return (
      <SettingsCard title="Nuvion" description={NUVION_ENTITY_APPROVED_COPY}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={statusPillClass(status)}>
            {formatNuvionEntityStatus(status)}
          </span>
          <span className="dashboard-pill dashboard-pill-neutral">
            {nuvionEnvironmentLabel(environment)}
          </span>
        </div>
        <p className="settings-hint mt-3">
          Own-currency payouts only — no FX conversion yet. KES mobile-money
          still uses the existing Kenya M-Pesa payout flow.
        </p>
      </SettingsCard>
    )
  }

  if (entity && isNuvionEntityPending(status)) {
    return (
      <SettingsCard
        title="Nuvion"
        description="Your Nuvion entity is under review. Payouts unlock once status is approved."
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className={statusPillClass(status)}>
            {formatNuvionEntityStatus(status)}
          </span>
          <span className="dashboard-pill dashboard-pill-neutral">
            {nuvionEnvironmentLabel(environment)}
          </span>
        </div>
        <p className="settings-hint mt-3">
          Status refreshes automatically. There is no resubmit path while review
          is in progress.
        </p>
      </SettingsCard>
    )
  }

  if (entity && isNuvionEntityTerminalFailure(status)) {
    return (
      <SettingsCard
        title="Nuvion"
        description="Nuvion could not approve this entity. Contact support — there is no retry from the portal today."
      >
        <span className={statusPillClass(status)}>
          {formatNuvionEntityStatus(status)}
        </span>
      </SettingsCard>
    )
  }

  return (
    <SettingsCard
      title="Get started with Nuvion"
      description={NUVION_ONBOARDING_COPY}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={statusPillClass(null)}>Not started</span>
        <span className="dashboard-pill dashboard-pill-neutral">
          {nuvionEnvironmentLabel(environment)}
        </span>
      </div>

      {!showForm ? (
        <Button
          type="button"
          className="dash-btn-primary mt-4"
          onClick={() => setShowForm(true)}
        >
          Register entity
        </Button>
      ) : (
        <div className="mt-4">
          <NuvionEntitySetupForm
            submitLabel="Submit for review"
            cancelLabel="Cancel"
            isSubmitting={createMutation.isPending}
            errorMessage={
              createMutation.isError ? createMutation.error.message : null
            }
            onCancel={() => setShowForm(false)}
            onSubmit={async (payload) => {
              await createMutation.mutateAsync(payload)
              setShowForm(false)
            }}
          />
        </div>
      )}
    </SettingsCard>
  )
}
