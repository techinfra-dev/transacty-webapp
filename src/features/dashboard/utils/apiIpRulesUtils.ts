const IPV4_CIDR_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/

export function isValidIpv4OrCidr(value: string) {
  return IPV4_CIDR_PATTERN.test(value.trim())
}

export function normalizeCidrEntry(value: string) {
  return value.trim()
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
