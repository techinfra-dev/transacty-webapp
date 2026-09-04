import { z } from 'zod'

/** Portal PIN is 4 digits. The API still accepts 4–6; we never collect more. */
export const PAYOUT_PIN_PATTERN = /^\d{4}$/
export const PAYOUT_PIN_MIN_LENGTH = 4
export const PAYOUT_PIN_MAX_LENGTH = 4
export const PAYOUT_PIN_LENGTH_COPY = '4 digits'

const pinSchema = z
  .string()
  .regex(PAYOUT_PIN_PATTERN, 'PIN must be 4 digits.')

export const payoutPinStatusSchema = z.object({
  configured: z.boolean(),
  lockedUntil: z.string().nullable().optional(),
})

export const setPayoutPinRequestSchema = z
  .object({
    pin: pinSchema,
    confirmPin: pinSchema,
  })
  .refine((value) => value.pin === value.confirmPin, {
    message: 'The PINs do not match.',
    path: ['confirmPin'],
  })

export const changePayoutPinRequestSchema = z
  .object({
    currentPin: pinSchema,
    newPin: pinSchema,
    confirmPin: pinSchema,
  })
  .refine((value) => value.newPin === value.confirmPin, {
    message: 'The new PINs do not match.',
    path: ['confirmPin'],
  })

export const resetPayoutPinRequestSchema = z
  .object({
    token: z.string().min(1, 'This reset link is missing its token.'),
    newPin: pinSchema,
    confirmPin: pinSchema,
  })
  .refine((value) => value.newPin === value.confirmPin, {
    message: 'The new PINs do not match.',
    path: ['confirmPin'],
  })

export const payoutPinOkResponseSchema = z.object({
  ok: z.boolean(),
})

export type PayoutPinStatus = z.infer<typeof payoutPinStatusSchema>
export type SetPayoutPinRequest = z.infer<typeof setPayoutPinRequestSchema>
export type ChangePayoutPinRequest = z.infer<typeof changePayoutPinRequestSchema>
export type ResetPayoutPinRequest = z.infer<typeof resetPayoutPinRequestSchema>

export function isValidPayoutPin(pin: string) {
  return PAYOUT_PIN_PATTERN.test(pin)
}

/** `lockedUntil` is only meaningful while it is still in the future. */
export function getPayoutPinLockRemainingMs(
  lockedUntil: string | null | undefined,
  now = Date.now(),
) {
  if (!lockedUntil) {
    return 0
  }
  const lockedUntilMs = new Date(lockedUntil).getTime()
  if (!Number.isFinite(lockedUntilMs)) {
    return 0
  }
  return Math.max(0, lockedUntilMs - now)
}

export function isPayoutPinLocked(
  lockedUntil: string | null | undefined,
  now = Date.now(),
) {
  return getPayoutPinLockRemainingMs(lockedUntil, now) > 0
}

export function formatPayoutPinLockCountdown(remainingMs: number) {
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) {
    return `${seconds}s`
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}
