import { useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '../../../../components/ui/Button.tsx'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import { PayoutPinBoxes } from '../../../auth/components/PayoutPinBoxes.tsx'
import { usePortalRole } from '../../../../hooks/usePortalRole.ts'
import {
  useChangePayoutPinMutation,
  usePayoutPinStatusQuery,
} from '../../hooks/usePayoutPinQueries.ts'
import {
  changePayoutPinRequestSchema,
  formatPayoutPinLockCountdown,
  getPayoutPinLockRemainingMs,
  isValidPayoutPin,
} from '../../services/payoutPinSchemas.ts'
import { SettingsCard } from './SettingsCard.tsx'

export function PayoutPinSettingsCard() {
  const { isAdmin } = usePortalRole()
  const statusQuery = usePayoutPinStatusQuery(isAdmin)
  const changeMutation = useChangePayoutPinMutation()
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const configured = statusQuery.data?.configured ?? false
  const lockRemaining = getPayoutPinLockRemainingMs(statusQuery.data?.lockedUntil)
  const isLocked = lockRemaining > 0

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isValidPayoutPin(currentPin) || !isValidPayoutPin(newPin)) {
      setError('PIN must be 4 digits.')
      return
    }

    const parsed = changePayoutPinRequestSchema.safeParse({
      currentPin,
      newPin,
      confirmPin,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'The new PINs do not match.')
      return
    }

    try {
      await changeMutation.mutateAsync(parsed.data)
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setSuccess('Payout PIN updated.')
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to change the payout PIN.',
      )
    }
  }

  if (!isAdmin) {
    return (
      <SettingsCard
        title="Payout PIN"
        description="This PIN is shared by everyone on your team who can send money."
      >
        <p className="settings-hint">
          Only an admin can set or change the merchant payout PIN. Ask an admin
          if you need it reset.
        </p>
      </SettingsCard>
    )
  }

  return (
    <SettingsCard
      title="Payout PIN"
      description="Used to authorize every payout. This PIN is shared by everyone on your team who can send money."
    >
      {statusQuery.isPending ? (
        <LoadingSpinner label="Loading payout PIN status…" />
      ) : !configured ? (
        <p className="settings-hint">
          No payout PIN is set yet.{' '}
          <Link
            to="/dashboard/onboarding/payout-pin"
            className="font-semibold underline underline-offset-2"
          >
            Set one now
          </Link>
          .
        </p>
      ) : (
        <form className="settings-stack" onSubmit={handleSubmit}>
          {isLocked ? (
            <p className="settings-error settings-error--inline">
              PIN is locked. Try again in{' '}
              {formatPayoutPinLockCountdown(lockRemaining)}.
            </p>
          ) : null}

          <PayoutPinBoxes
            label="Current PIN"
            value={currentPin}
            onChange={setCurrentPin}
            disabled={changeMutation.isPending || isLocked}
          />
          <PayoutPinBoxes
            label="New PIN"
            value={newPin}
            onChange={setNewPin}
            disabled={changeMutation.isPending || isLocked}
            hint="4 digits"
          />
          <PayoutPinBoxes
            label="Confirm new PIN"
            value={confirmPin}
            onChange={setConfirmPin}
            disabled={changeMutation.isPending || isLocked}
          />

          {error ? (
            <p className="settings-error settings-error--inline">{error}</p>
          ) : null}
          {success ? (
            <p className="settings-hint">{success}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              className="px-4"
              disabled={changeMutation.isPending || isLocked}
            >
              {changeMutation.isPending ? 'Updating…' : 'Change PIN'}
            </Button>
            <Link
              to="/forgot-payout-pin"
              className="[font-family:var(--font-body)] text-sm font-semibold text-(--dash-fg-muted) underline underline-offset-2"
            >
              Forgot PIN?
            </Link>
          </div>
        </form>
      )}
    </SettingsCard>
  )
}
