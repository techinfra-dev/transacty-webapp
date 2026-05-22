import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  merchantWalletsResponseSchema,
  type MerchantWalletsResponse,
} from './walletsSchemas.ts'

export async function getMerchantWallets(
  environment: PortalEnvironment,
): Promise<MerchantWalletsResponse> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  const response = await axiosInstance.get('me/wallets', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { environment },
  })

  return merchantWalletsResponseSchema.parse(response.data)
}
