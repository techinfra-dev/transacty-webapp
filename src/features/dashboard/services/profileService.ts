import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  profileResponseSchema,
  updateProfileRequestSchema,
  updateProfileResponseSchema,
  type ProfileResponse,
  type UpdateProfileRequest,
} from './profileSchemas.ts'

export async function getProfile(): Promise<ProfileResponse> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  const response = await axiosInstance.get('me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return profileResponseSchema.parse(response.data)
}

export async function updateProfile(
  payload: UpdateProfileRequest,
): Promise<{ ok: boolean }> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  const validatedPayload = updateProfileRequestSchema.parse(payload)

  const response = await axiosInstance.patch('me', validatedPayload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return updateProfileResponseSchema.parse(response.data)
}
