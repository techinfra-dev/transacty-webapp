const KEY_TTL_MS = 15 * 60 * 1000

const keysByRequest = new Map<string, { key: string; createdAt: number }>()

/** `crypto.randomUUID` is unavailable outside secure contexts (plain-http hosts). */
export function createIdempotencyKey() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

function hashPayload(value: unknown) {
  const serialized = JSON.stringify(value) ?? 'null'
  let hash = 0x811c9dc5
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16)
}

function prune(now: number) {
  for (const [cacheKey, entry] of keysByRequest) {
    if (now - entry.createdAt > KEY_TTL_MS) {
      keysByRequest.delete(cacheKey)
    }
  }
}

/**
 * Same endpoint + same body reuses one key, so a resubmit after a timeout is
 * replayed by the server instead of creating a second payout. A changed body
 * produces a new key, avoiding the 409 body_mismatch conflict.
 */
export function getStableIdempotencyKey(scope: string, payload: unknown) {
  const now = Date.now()
  prune(now)
  const cacheKey = `${scope}:${hashPayload(payload)}`
  const existing = keysByRequest.get(cacheKey)
  if (existing) {
    return existing.key
  }
  const key = createIdempotencyKey()
  keysByRequest.set(cacheKey, { key, createdAt: now })
  return key
}

/** Call once a create succeeds so an intentional repeat is treated as new. */
export function releaseIdempotencyKey(scope: string, payload: unknown) {
  keysByRequest.delete(`${scope}:${hashPayload(payload)}`)
}
