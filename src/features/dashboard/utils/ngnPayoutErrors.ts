import { AxiosError } from 'axios'
import { apiErrorSchema } from '../../auth/services/authSchemas.ts'

export const NGN_BVN_REQUIRED_CODE = 'ngn_bvn_required'
export const NGN_INSUFFICIENT_BALANCE_CODE = 'insufficient_balance'
export const NGN_PAYOUT_FAILED_CODE = 'payout_failed'

export const NGN_BVN_REQUIRED_COPY =
  'Complete BVN verification before NGN payouts. Submit your BVN under Nigeria virtual account settings.'

export const NGN_INSUFFICIENT_BALANCE_COPY =
  'Not enough available NGN to send this payout.'

export const NGN_PAYOUT_FAILED_COPY =
  'This payout could not be sent. Retry shortly, or contact support if it happens again.'

type PortalErrorFields = {
  status: number
  code: string
  message: string
}

export class NgnBvnRequiredError extends Error {
  readonly code = NGN_BVN_REQUIRED_CODE

  constructor(message = NGN_BVN_REQUIRED_COPY) {
    super(message)
    this.name = 'NgnBvnRequiredError'
  }
}

export class NgnInsufficientBalanceError extends Error {
  readonly code = NGN_INSUFFICIENT_BALANCE_CODE

  constructor(message = NGN_INSUFFICIENT_BALANCE_COPY) {
    super(message)
    this.name = 'NgnInsufficientBalanceError'
  }
}

export class NgnPayoutFailedError extends Error {
  readonly code = NGN_PAYOUT_FAILED_CODE

  constructor(message = NGN_PAYOUT_FAILED_COPY) {
    super(message)
    this.name = 'NgnPayoutFailedError'
  }
}

/** 400 with no `code` — used to consult VA status before showing a generic error. */
export class NgnPayoutUncodedError extends Error {
  readonly status = 400

  constructor(message: string) {
    super(message)
    this.name = 'NgnPayoutUncodedError'
  }
}

export type NgnPayoutCodedError =
  | NgnBvnRequiredError
  | NgnInsufficientBalanceError
  | NgnPayoutFailedError

export type NgnPayoutSubmitError =
  | { code: 'insufficient_balance'; formattedBalance: string }
  | { code: 'payout_failed' }


function readPortalErrorFields(error: unknown): PortalErrorFields | null {
  if (!(error instanceof AxiosError) || !error.response) {
    return null
  }
  const data = error.response.data
  const parsed = apiErrorSchema.safeParse(data)
  const codeFromBody =
    parsed.success && parsed.data.code
      ? parsed.data.code
      : typeof data === 'object' && data && 'code' in data
        ? String((data as { code?: unknown }).code ?? '')
        : ''
  const messageFromBody =
    parsed.success
      ? parsed.data.message
      : typeof data === 'object' && data && 'message' in data
        ? String((data as { message?: unknown }).message ?? '')
        : ''
  const errorFromBody =
    parsed.success
      ? parsed.data.error
      : typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: unknown }).error ?? '')
        : ''
  return {
    status: error.response.status,
    code: codeFromBody.trim(),
    message: messageFromBody.trim() || errorFromBody.trim(),
  }
}

function isBvnVerificationMessage(message: string) {
  return message.toLowerCase().includes('bvn verification')
}

export function parseNgnBvnRequiredError(error: unknown) {
  if (error instanceof NgnBvnRequiredError) {
    return error
  }
  const fields = readPortalErrorFields(error)
  if (!fields || fields.status !== 400) {
    return null
  }
  const byCode = fields.code === NGN_BVN_REQUIRED_CODE
  const byMessage = !fields.code && isBvnVerificationMessage(fields.message)
  if (!byCode && !byMessage) {
    return null
  }
  return new NgnBvnRequiredError(fields.message || NGN_BVN_REQUIRED_COPY)
}

export function parseNgnPayoutCodedError(
  error: unknown,
): NgnPayoutCodedError | null {
  if (
    error instanceof NgnBvnRequiredError ||
    error instanceof NgnInsufficientBalanceError ||
    error instanceof NgnPayoutFailedError
  ) {
    return error
  }

  const bvn = parseNgnBvnRequiredError(error)
  if (bvn) {
    return bvn
  }

  const fields = readPortalErrorFields(error)
  if (!fields || fields.status !== 400) {
    return null
  }

  if (fields.code === NGN_INSUFFICIENT_BALANCE_CODE) {
    return new NgnInsufficientBalanceError(
      fields.message || NGN_INSUFFICIENT_BALANCE_COPY,
    )
  }
  if (fields.code === NGN_PAYOUT_FAILED_CODE) {
    return new NgnPayoutFailedError(fields.message || NGN_PAYOUT_FAILED_COPY)
  }
  return null
}

export function parseNgnPayoutUncodedError(error: unknown) {
  if (error instanceof NgnPayoutUncodedError) {
    return error
  }
  const fields = readPortalErrorFields(error)
  if (!fields || fields.status !== 400 || fields.code) {
    return null
  }
  return new NgnPayoutUncodedError(
    fields.message || 'Unable to complete the NGN payout right now.',
  )
}

/**
 * Re-throws typed NGN payout 400s so callers can route by `code` instead of
 * scraping `message`. PIN checks must run first.
 */
export function assertNgnPayoutCodedError(error: unknown): void {
  const parsed = parseNgnPayoutCodedError(error)
  if (parsed) {
    throw parsed
  }
  const uncoded = parseNgnPayoutUncodedError(error)
  if (uncoded) {
    throw uncoded
  }
}

export function assertNotNgnBvnRequired(error: unknown): void {
  const parsed = parseNgnBvnRequiredError(error)
  if (parsed) {
    throw parsed
  }
}
