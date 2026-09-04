import { useState, type ComponentProps } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { PayoutPinBoxes } from '../../auth/components/PayoutPinBoxes.tsx'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import { useSetPayoutPinMutation } from '../hooks/usePayoutPinQueries.ts'
import {
  isValidPayoutPin,
  setPayoutPinRequestSchema,
} from '../services/payoutPinSchemas.ts'

export function OnboardingPayoutPinPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePortalRole()
  const setPinMutation = useSetPayoutPinMutation()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    setError(null)

    if (!isValidPayoutPin(pin)) {
      setError('PIN must be 4 digits.')
      return
    }

    const parsed = setPayoutPinRequestSchema.safeParse({ pin, confirmPin })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'The PINs do not match.')
      return
    }

    try {
      await setPinMutation.mutateAsync(parsed.data)
      await navigate({ to: '/dashboard' })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to set the payout PIN.',
      )
    }
  }

  if (!isAdmin) {
    return (
      <section className="app-page-enter mx-auto max-w-lg space-y-3">
        <h1 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--dash-fg)">
          Waiting on an admin
        </h1>
        <p className="[font-family:var(--font-body)] text-sm text-(--dash-fg-muted)">
          An admin must set the merchant payout PIN before you can use the
          dashboard.
        </p>
      </section>
    )
  }

  return (
    <section className="app-page-enter mx-auto max-w-lg space-y-5">
      <header className="space-y-1">
        <h1 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--dash-fg)">
          Set a payout PIN
        </h1>
        <p className="[font-family:var(--font-body)] text-sm leading-6 text-(--dash-fg-muted)">
          Choose a 4-digit PIN used to authorize payouts. This PIN is shared
          by everyone on your team who can send money.
        </p>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <PayoutPinBoxes
          label="Payout PIN"
          value={pin}
          onChange={setPin}
          autoFocus
          disabled={setPinMutation.isPending}
          hint="4 digits"
        />
        <PayoutPinBoxes
          label="Confirm PIN"
          value={confirmPin}
          onChange={setConfirmPin}
          disabled={setPinMutation.isPending}
          hasError={Boolean(error)}
        />

        {error ? (
          <p className="payout-pin-alert">{error}</p>
        ) : null}

        <Button
          type="submit"
          className="px-5"
          disabled={setPinMutation.isPending}
        >
          {setPinMutation.isPending ? 'Saving…' : 'Save payout PIN'}
        </Button>
      </form>
    </section>
  )
}
