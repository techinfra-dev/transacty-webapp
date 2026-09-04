import { useCallback, useEffect, useState, type ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Dialog } from '../../../components/ui/Dialog.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import { OtpInput } from '../../../components/ui/OtpInput.tsx'
import { usePayoutPinPromptStore } from '../../../store/payoutPinPromptStore.ts'
import { usePortalRole } from '../../../hooks/usePortalRole.ts'
import {
  PAYOUT_PIN_MAX_LENGTH,
  formatPayoutPinLockCountdown,
  getPayoutPinLockRemainingMs,
  isValidPayoutPin,
} from '../../dashboard/services/payoutPinSchemas.ts'

const PIN_FORM_ID = 'payout-pin-form'

export function PayoutPinDialog() {
  const isOpen = usePayoutPinPromptStore((state) => state.isOpen)
  const description = usePayoutPinPromptStore((state) => state.description)
  const errorMessage = usePayoutPinPromptStore((state) => state.errorMessage)
  const lockedUntil = usePayoutPinPromptStore((state) => state.lockedUntil)
  const submit = usePayoutPinPromptStore((state) => state.submit)
  const cancel = usePayoutPinPromptStore((state) => state.cancel)
  const { isAdmin } = usePortalRole()

  const [pin, setPin] = useState('')
  const [shakeKey, setShakeKey] = useState(0)
  const [lockRemainingMs, setLockRemainingMs] = useState(0)

  // A rejected PIN clears the boxes and shakes them, so the merchant is not
  // left editing a value the server already refused.
  useEffect(() => {
    if (errorMessage) {
      setPin('')
      setShakeKey((previous) => previous + 1)
    }
  }, [errorMessage])

  useEffect(() => {
    if (!isOpen) {
      setPin('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !lockedUntil) {
      setLockRemainingMs(0)
      return
    }
    const tick = () => setLockRemainingMs(getPayoutPinLockRemainingMs(lockedUntil))
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [isOpen, lockedUntil])

  const isLocked = lockRemainingMs > 0
  const canSubmit = isValidPayoutPin(pin) && !isLocked

  function handleClose() {
    setPin('')
    cancel()
  }

  const authorize = useCallback(
    (value: string) => {
      if (!isValidPayoutPin(value) || isLocked) {
        return
      }
      setPin('')
      submit(value)
    },
    [isLocked, submit],
  )

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (
    event,
  ) => {
    event.preventDefault()
    authorize(pin)
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Payout PIN"
      description={
        description ??
        'Enter the PIN your team uses to authorize payouts.'
      }
      maxWidthClassName="max-w-[20.5rem]"
      bodyVariant="plain"
      closeOnBackdrop={!isLocked}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" className="px-4" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={PIN_FORM_ID}
            className="px-4"
            disabled={!canSubmit}
          >
            Authorize
          </Button>
        </div>
      }
    >
      <form id={PIN_FORM_ID} className="payout-pin-form" onSubmit={handleSubmit}>
        <span className="payout-pin-label">Payout PIN</span>

        <div key={shakeKey} className={errorMessage ? 'payout-pin-shake' : undefined}>
          <OtpInput
            length={PAYOUT_PIN_MAX_LENGTH}
            value={pin}
            onChange={setPin}
            onComplete={authorize}
            disabled={isLocked}
            autoFocus
            mask
            size="lg"
            hasError={Boolean(errorMessage)}
            align="stretch"
            aria-label="Payout PIN"
          />
        </div>

        <p className="payout-pin-hint">4 digits</p>

        {isLocked ? (
          <p className="payout-pin-alert">
            Too many failed attempts. Try again in{' '}
            <strong>{formatPayoutPinLockCountdown(lockRemainingMs)}</strong>.
          </p>
        ) : errorMessage ? (
          <p className="payout-pin-alert">{errorMessage}</p>
        ) : null}

        {isAdmin ? (
          <Link
            to="/forgot-payout-pin"
            className="payout-pin-forgot"
            onClick={handleClose}
          >
            Forgot your PIN?
          </Link>
        ) : (
          <p className="payout-pin-hint">
            Ask an admin on your team if you need the PIN reset.
          </p>
        )}
      </form>
    </Dialog>
  )
}
