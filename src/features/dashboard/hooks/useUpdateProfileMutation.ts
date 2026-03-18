import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '../services/profileService.ts'

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile-me'] })
    },
  })
}
