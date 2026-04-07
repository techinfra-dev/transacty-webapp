import { useQuery } from '@tanstack/react-query'
import { useAuthMerchantId } from '../../../hooks/useAuthMerchantId.ts'
import { getProfile } from '../services/profileService.ts'

export function useProfileQuery(enabled = true) {
  const merchantId = useAuthMerchantId()
  return useQuery({
    queryKey: ['profile-me', merchantId],
    queryFn: getProfile,
    enabled: enabled && Boolean(merchantId),
    staleTime: 60_000,
  })
}
