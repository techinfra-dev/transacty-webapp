import { useEffect, useState } from 'react'
import {
  getAuthUser,
  subscribeToAuthSessionUpdates,
} from '../features/auth/services/authSession.ts'

export function useAuthMerchantId(): string | null {
  const [merchantId, setMerchantId] = useState<string | null>(
    () => getAuthUser()?.merchantId ?? null,
  )

  useEffect(() => {
    return subscribeToAuthSessionUpdates(() => {
      setMerchantId(getAuthUser()?.merchantId ?? null)
    })
  }, [])

  return merchantId
}
