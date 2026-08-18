const AUDIT_ACTION_LABELS: Record<string, string> = {
  'portal.session.login': 'Signed in',
  'portal.session.logout': 'Signed out',
  'portal.api_ip_rules.updated': 'IP rules updated',
  'portal.api_key.created': 'Key created',
  'portal.api_key.revoked': 'Key revoked',
  'portal.api_key.auto_revoked_prior_live': 'Prior live keys revoked',
}

export function formatAuditAction(action: string) {
  const known = AUDIT_ACTION_LABELS[action]
  if (known) {
    return known
  }

  return action
    .replace(/^portal\./, '')
    .split(/[._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatAuditDate(isoDate: string) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return isoDate
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
