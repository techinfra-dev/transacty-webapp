import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../services/profileService.ts'

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: ['profile-me'],
    queryFn: getProfile,
    enabled,
    staleTime: 60_000,
  })
}
