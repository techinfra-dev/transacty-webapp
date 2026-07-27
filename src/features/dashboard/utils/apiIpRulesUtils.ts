const IPV4_CIDR_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/

export const API_IP_NOTES_MAX_LENGTH = 250

export function isValidIpv4OrCidr(value: string) {
  return IPV4_CIDR_PATTERN.test(value.trim())
}

export function normalizeCidrEntry(value: string) {
  return value.trim()
}

export function isDuplicateCidr(entries: string[], candidate: string) {
  const normalized = normalizeCidrEntry(candidate)
  if (!normalized) {
    return false
  }
  return entries.some((entry) => normalizeCidrEntry(entry) === normalized)
}

export function dedupeCidrs(entries: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const entry of entries) {
    const normalized = normalizeCidrEntry(entry)
    if (!normalized || seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

export function getCidrKindLabel(value: string) {
  return value.includes('/') ? 'CIDR' : 'IP address'
}
