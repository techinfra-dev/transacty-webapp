import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  balanceResponseSchema,
  type BalanceResponse,
} from './balanceSchemas.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'

export async function getBalance(
  environment: PortalEnvironment,
): Promise<BalanceResponse> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  const response = await axiosInstance.get('me/balance', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: { environment },
  })

  return balanceResponseSchema.parse(response.data)
}
