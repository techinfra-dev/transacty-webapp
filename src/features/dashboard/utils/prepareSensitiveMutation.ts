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
 */
export async function runPayoutWrite<T>(
  run: (input: { stepUpToken: string | undefined; pin: string }) => Promise<T>,
  options?: { description?: string },
): Promise<T> {
  const { stepUpToken } = await prepareMoneyWriteHeaders()
  let pin = await ensurePayoutPin({ description: options?.description })

  for (;;) {
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
      pin = await ensurePayoutPin({
        errorMessage: error.info.message,
        lockedUntil: error.info.lockedUntil ?? null,
      })
    }
  }
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
