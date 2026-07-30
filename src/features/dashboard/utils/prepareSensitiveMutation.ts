import { getAuthUser } from '../../auth/services/authSession.ts'
import { ensurePortalStepUp } from '../../../store/portalStepUpStore.ts'
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

export async function prepareAdminStepUp(action: Extract<
  PortalStepUpAction,
  'api_keys.write' | 'webhook.write'
>) {
  assertIsAdmin()
  const user = getAuthUser()
  const stepUpToken = await ensurePortalStepUp({
    action,
    mfaEnabled: Boolean(user?.mfaEnabled),
    description:
      action === 'api_keys.write'
        ? 'Enter your authenticator code to manage API keys.'
        : 'Enter your authenticator code to update webhook settings.',
  })
  return { stepUpToken }
}
