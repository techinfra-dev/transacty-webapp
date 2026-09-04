import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthMerchantId } from '../../../hooks/useAuthMerchantId.ts'
import { markPayoutPinConfiguredInSession } from '../../auth/services/authSession.ts'
import { getProfile } from '../services/profileService.ts'

export function OnboardingWaitingForAdminPage() {
  const navigate = useNavigate()
  const merchantId = useAuthMerchantId()
  const profileQuery = useQuery({
    queryKey: ['profile-me', merchantId],
    queryFn: getProfile,
    enabled: Boolean(merchantId),
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (!profileQuery.data?.payoutPinConfigured) {
      return
    }
    markPayoutPinConfiguredInSession()
    void navigate({ to: '/dashboard' })
  }, [navigate, profileQuery.data?.payoutPinConfigured])

  return (
    <section className="app-page-enter mx-auto max-w-lg space-y-3">
      <h1 className="[font-family:var(--font-display)] text-2xl font-semibold text-(--dash-fg)">
        Waiting on an admin
      </h1>
      <p className="[font-family:var(--font-body)] text-sm leading-6 text-(--dash-fg-muted)">
        An admin must set the merchant payout PIN before you can use the
        dashboard. You can stay signed in — this page unlocks automatically
        once the PIN is configured.
      </p>
    </section>
  )
}
