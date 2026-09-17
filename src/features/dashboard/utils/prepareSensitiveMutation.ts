import { getAuthUser } from '../../auth/services/authSession.ts'
import { ensurePortalStepUp } from '../../../store/portalStepUpStore.ts'
import { ensurePayoutPin } from '../../../store/payoutPinPromptStore.ts'
import { PayoutPinError } from './payoutPinErrors.ts'
import {
  assertCanWriteMoney,
  assertIsAdmin,
} from '../../../utils/portalRoles.ts'
import type { PortalStepUpAction } from '../../auth/services/authSchemas.ts'

/** Role check + optional MFA step-up before money creates. */
export async function prepareMoneyWriteHeaders() {
  assertCanWriteMoney()
  const user = getAuthUser()
  const stepUpToken = await ensurePortalStepUp({
    action: 'money.write',
    mfaEnabled: Boolean(user?.mfaEnabled),
    description:
      'Enter your authenticator code to authorize this money operation.',
  })
  return { stepUpToken }
}

/**
 * Payout creates need both confirmations: the authenticator step-up in the
 * header and the merchant payout PIN in the body. Step-up runs first so the
 * PIN is the last thing on screen before the money moves. A rejected PIN
 * re-opens the same prompt rather than failing the whole form.
 *
 * Step-up tokens are single-use. Every attempt — including a PIN retry —
 * mints a fresh TOTP token.
 */
export async function runPayoutWrite<T>(
  run: (input: { stepUpToken: string | undefined; pin: string }) => Promise<T>,
  options?: { description?: string },
): Promise<T> {
  let pinError: { message: string; lockedUntil?: string | null } | null = null
  for (;;) {
    const { stepUpToken } = await prepareMoneyWriteHeaders()
    const pin = await ensurePayoutPin({
      description: options?.description,
      errorMessage: pinError?.message,
      lockedUntil: pinError?.lockedUntil ?? null,
    })
    try {
      return await run({ stepUpToken, pin })
    } catch (error) {
      if (!(error instanceof PayoutPinError)) {
        throw error
      }
      // Only a wrong or locked PIN is worth another attempt — a merchant with
      // no PIN configured needs an admin, not a retry.
      if (!error.info.invalid && !error.info.locked) {
        throw new Error(error.info.message)
      }
      pinError = {
        message: error.info.message,
        lockedUntil: error.info.lockedUntil ?? null,
      }
    }
  }
}

/**
 * Approve a queued payout: fresh step-up (`payout_approval.review`) then PIN.
 * Tokens cannot be reused across attempts.
 */
export async function runPayoutApprovalApprove<T>(
  run: (input: { stepUpToken: string | undefined; pin: string }) => Promise<T>,
): Promise<T> {
  assertCanWriteMoney()
  const user = getAuthUser()
  let pinError: { message: string; lockedUntil?: string | null } | null = null
  for (;;) {
    const stepUpToken = await ensurePortalStepUp({
      action: 'payout_approval.review',
      mfaEnabled: Boolean(user?.mfaEnabled),
      description:
        'Enter your authenticator code to review this payout approval.',
    })
    const pin = await ensurePayoutPin({
      description: 'Enter your payout PIN to approve this payout.',
      errorMessage: pinError?.message,
      lockedUntil: pinError?.lockedUntil ?? null,
    })
    try {
      return await run({ stepUpToken, pin })
    } catch (error) {
      if (!(error instanceof PayoutPinError)) {
        throw error
      }
      if (!error.info.invalid && !error.info.locked) {
        throw new Error(error.info.message)
      }
      pinError = {
        message: error.info.message,
        lockedUntil: error.info.lockedUntil ?? null,
      }
    }
  }
}

/** Reject a queued payout: fresh step-up, no PIN. */
export async function runPayoutApprovalReject<T>(
  run: (input: { stepUpToken: string | undefined }) => Promise<T>,
): Promise<T> {
  assertCanWriteMoney()
  const user = getAuthUser()
  const stepUpToken = await ensurePortalStepUp({
    action: 'payout_approval.review',
    mfaEnabled: Boolean(user?.mfaEnabled),
    description:
      'Enter your authenticator code to reject this payout approval.',
  })
  return run({ stepUpToken })
}

export async function prepareAdminStepUp(
  action: Extract<
    PortalStepUpAction,
    'api_keys.write' | 'webhook.write' | 'audit.export' | 'payout_pin.write'
  >,
) {
  assertIsAdmin()
  const user = getAuthUser()
  const stepUpToken = await ensurePortalStepUp({
    action,
    mfaEnabled: Boolean(user?.mfaEnabled),
    description:
      action === 'api_keys.write'
        ? 'Enter your authenticator code to manage API keys.'
        : action === 'audit.export'
          ? 'Enter your authenticator code to export the audit log.'
          : action === 'payout_pin.write'
            ? 'Enter your authenticator code to change the payout PIN.'
            : 'Enter your authenticator code to update webhook settings.',
  })
  return { stepUpToken }
}
