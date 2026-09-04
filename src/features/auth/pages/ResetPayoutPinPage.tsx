import { useMemo, useState, type ComponentProps } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from '../../../components/ui/Button.tsx'
import { Toast } from '../../../components/ui/Toast.tsx'
import { PayoutPinBoxes } from '../components/PayoutPinBoxes.tsx'
import { isAuthenticated } from '../services/authSession.ts'
import { useResetPayoutPinMutation } from '../../dashboard/hooks/usePayoutPinQueries.ts'
import {
  isValidPayoutPin,
  resetPayoutPinRequestSchema,
} from '../../dashboard/services/payoutPinSchemas.ts'

export function ResetPayoutPinPage() {
  const navigate = useNavigate()
  const search = useRouterState({ select: (state) => state.location.search })
  const token = useMemo(
    () => new URLSearchParams(search).get('token') ?? '',
    [search],
  )
  const loggedIn = isAuthenticated()
  const resetMutation = useResetPayoutPinMutation()
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loginHref = token
    ? `/login?next=${encodeURIComponent(`/reset-payout-pin?token=${token}`)}`
    : '/login'

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (
    event,
  ) => {
    event.preventDefault()
    if (resetMutation.isPending || !token) {
      return
    }

    setErrorMessage(null)
    if (!isValidPayoutPin(newPin)) {
      setErrorMessage('PIN must be 4 digits.')
      return
    }

    const parsed = resetPayoutPinRequestSchema.safeParse({
      token,
      newPin,
      confirmPin,
    })
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? 'The new PINs do not match.',
      )
      return
    }

    try {
      await resetMutation.mutateAsync(parsed.data)
      setSuccessMessage('Your payout PIN has been updated.')
      window.setTimeout(() => {
        void navigate({ to: '/dashboard' })
      }, 1200)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to reset the payout PIN. Please try again.',
      )
    }
  }

  if (!token) {
    return (
      <div className="auth-form-enter space-y-5">
        <p className="[font-family:var(--font-body)] text-sm text-(--color-secondary)">
          This reset link is missing a valid token. Request a new link from the
          forgot PIN page.
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() => void navigate({ to: '/forgot-payout-pin' })}
        >
          Forgot payout PIN
        </Button>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="auth-form-enter space-y-5">
        <p className="[font-family:var(--font-body)] text-sm leading-6 text-(--auth-surface-muted)">
          Sign in as the admin who requested this reset, then confirm with your
          authenticator app to choose a new PIN.
        </p>
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            window.location.assign(loginHref)
          }}
        >
          Sign in to continue
        </Button>
        <p className="text-center [font-family:var(--font-body)] text-sm text-[#566167]">
          <Link
            to="/forgot-payout-pin"
            className="font-semibold text-[#c58b6b] transition hover:text-[#a97659]"
          >
            Request a new link
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <form className="auth-form-enter space-y-5" onSubmit={handleSubmit}>
        <PayoutPinBoxes
          label="New PIN"
          value={newPin}
          onChange={setNewPin}
          autoFocus
          disabled={resetMutation.isPending}
          hint="4 digits"
        />
        <PayoutPinBoxes
          label="Confirm new PIN"
          value={confirmPin}
          onChange={setConfirmPin}
          disabled={resetMutation.isPending}
        />

        <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? 'Updating…' : 'Save new PIN'}
        </Button>
      </form>

      {errorMessage ? (
        <Toast
          message={errorMessage}
          variant="error"
          onClose={() => setErrorMessage(null)}
        />
      ) : null}
      {successMessage ? (
        <Toast
          message={successMessage}
          variant="success"
          onClose={() => setSuccessMessage(null)}
        />
      ) : null}
    </>
  )
}
