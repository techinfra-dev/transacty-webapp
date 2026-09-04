import { AxiosError } from 'axios'
import { apiErrorSchema } from '../../auth/services/authSchemas.ts'
import {
  formatPayoutPinLockCountdown,
  getPayoutPinLockRemainingMs,
} from '../services/payoutPinSchemas.ts'

export type PayoutPinErrorInfo = {
  message: string
  /** Wrong PIN — the merchant can retry immediately. */
  invalid: boolean
  /** Too many failed attempts — retry is blocked until `lockedUntil`. */
  locked: boolean
  lockedUntil?: string
  /** PIN was missing from the request, or no PIN exists for the merchant. */
  required: boolean
  notConfigured: boolean
}

export class PayoutPinError extends Error {
  readonly info: PayoutPinErrorInfo

  constructor(info: PayoutPinErrorInfo) {
    super(info.message)
    this.name = 'PayoutPinError'
    this.info = info
  }
}

/**
 * Payout services wrap failures into plain `Error`s, which would erase the PIN
 * flags. Call this first so PIN failures stay re-promptable.
 */
export function assertNotPayoutPinError(error: unknown): void {
  const info = parsePayoutPinError(error)
  if (info) {
    throw new PayoutPinError(info)
  }
}

/**
 * Recognises the payout PIN failure shapes so callers can re-prompt instead of
 * showing a raw API error.
 */
export function parsePayoutPinError(error: unknown): PayoutPinErrorInfo | null {
  if (!(error instanceof AxiosError) || !error.response) {
    return null
  }
  const parsed = apiErrorSchema.safeParse(error.response.data)
  if (!parsed.success) {
    return null
  }

  const body = parsed.data
  const isPinError =
    body.payoutPinInvalid ||
    body.payoutPinLocked ||
    body.payoutPinRequired ||
    body.payoutPinConfigured === false
  if (!isPinError) {
    return null
  }

  const notConfigured =
    body.payoutPinConfigured === false && !body.payoutPinInvalid

  return {
    message: buildMessage(body, notConfigured),
    invalid: Boolean(body.payoutPinInvalid),
    locked: Boolean(body.payoutPinLocked),
    lockedUntil: body.lockedUntil,
    required: Boolean(body.payoutPinRequired),
    notConfigured,
  }
}

function buildMessage(
  body: {
    message?: string
    payoutPinInvalid?: boolean
    payoutPinLocked?: boolean
    lockedUntil?: string
  },
  notConfigured: boolean,
) {
  if (body.payoutPinLocked) {
    const remaining = getPayoutPinLockRemainingMs(body.lockedUntil)
    return remaining > 0
      ? `Payout PIN is locked after too many failed attempts. Try again in ${formatPayoutPinLockCountdown(remaining)}.`
      : 'Payout PIN is temporarily locked after too many failed attempts. Try again shortly.'
  }
  if (body.payoutPinInvalid) {
    return 'Incorrect payout PIN. Please try again.'
  }
  if (notConfigured) {
    return 'No payout PIN is set for this merchant yet. An admin must set one in Settings → Security before payouts can be sent.'
  }
  return body.message?.trim() || 'Payout PIN is required to send this payout.'
}
