import { create } from 'zustand'
import { getAuthUser } from '../features/auth/services/authSession.ts'
import type { PortalEnvironment } from '../types/portalEnvironment.ts'

const BY_MERCHANT_KEY = 'transacty-portal-environment-by-merchant'
const LEGACY_PERSIST_KEY = 'transacty-portal-environment'

function isPortalEnvironment(value: unknown): value is PortalEnvironment {
  return value === 'test' || value === 'live'
}

function readMap(): Record<string, PortalEnvironment> {
  try {
    const raw = localStorage.getItem(BY_MERCHANT_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    const out: Record<string, PortalEnvironment> = {}
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof k === 'string' && isPortalEnvironment(v)) {
        out[k] = v
      }
    }
    return out
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, PortalEnvironment>) {
  localStorage.setItem(BY_MERCHANT_KEY, JSON.stringify(map))
}

function migrateLegacyEnvironmentForMerchant(merchantId: string) {
  try {
    const raw = localStorage.getItem(LEGACY_PERSIST_KEY)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw) as { state?: { environment?: unknown } }
    const env = parsed.state?.environment
    if (!isPortalEnvironment(env)) {
      localStorage.removeItem(LEGACY_PERSIST_KEY)
      return
    }
    const map = readMap()
    if (map[merchantId] === undefined) {
      map[merchantId] = env
      writeMap(map)
    }
    localStorage.removeItem(LEGACY_PERSIST_KEY)
  } catch {
    localStorage.removeItem(LEGACY_PERSIST_KEY)
  }
}

/**
 * Loads the persisted portal environment for the signed-in merchant.
 * Call from dashboard route `beforeLoad` and when `merchantId` changes (e.g. session refresh).
 */
export function hydratePortalEnvironmentForUser(merchantId: string | null) {
  if (!merchantId) {
    usePortalEnvironmentStore.setState({ environment: 'test' })
    return
  }

  migrateLegacyEnvironmentForMerchant(merchantId)

  const map = readMap()
  const stored = map[merchantId]
  usePortalEnvironmentStore.setState({
    environment: isPortalEnvironment(stored) ? stored : 'test',
  })
}

interface PortalEnvironmentState {
  environment: PortalEnvironment
  setEnvironment: (environment: PortalEnvironment) => void
}

export const usePortalEnvironmentStore = create<PortalEnvironmentState>()((set) => ({
  environment: 'test',
  setEnvironment: (environment) => {
    const user = getAuthUser()
    if (user?.merchantId) {
      const map = readMap()
      map[user.merchantId] = environment
      writeMap(map)
    }
    set({ environment })
  },
}))
