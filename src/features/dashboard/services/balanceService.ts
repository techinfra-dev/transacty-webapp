import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  balanceResponseSchema,
  type BalanceResponse,
} from './balanceSchemas.ts'

export async function getBalance(): Promise<BalanceResponse> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }

  const response = await axiosInstance.get('me/balance', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return balanceResponseSchema.parse(response.data)
}
