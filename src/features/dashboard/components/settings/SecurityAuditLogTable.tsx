import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner.tsx'
import {
  getAuditLogMeta,
  type AuditLogItem,
} from '../../services/auditLogSchemas.ts'
import {
  formatAuditAction,
  formatAuditDate,
} from '../../utils/auditDisplayUtils.ts'

function formatScopeLabel(scopes: string) {
  if (scopes === '*') {
    return 'All scopes'
  }
  return scopes
    .split(',')
    .map((scope) => scope.trim().replace(':', ' · '))
    .filter(Boolean)
    .join(', ')
}

function truncateId(value: string) {
  if (value.length <= 12) {
    return value
  }
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

function environmentPillClass(environment: string) {
  if (environment === 'live') {
    return 'dashboard-pill dashboard-pill-succ'
  }
  if (environment === 'test') {
    return 'dashboard-pill dashboard-pill-pend'
  }
  return 'dashboard-pill dashboard-pill-neutral'
}

function formatDetails(item: AuditLogItem) {
  const meta = getAuditLogMeta(item)
  const parts: string[] = []

  if (meta.scopes) {
    parts.push(formatScopeLabel(meta.scopes))
  }

  if (meta.revokedIds && meta.revokedIds.length > 0) {
    parts.push(
      `${meta.revokedIds.length} key${meta.revokedIds.length === 1 ? '' : 's'}`,
    )
  } else if (item.resource) {
    parts.push(truncateId(item.resource))
  }

  return parts.join(' · ') || '—'
}

interface SecurityAuditLogTableProps {
  items: AuditLogItem[]
  isPending: boolean
  isError: boolean
  errorMessage?: string
}

export function SecurityAuditLogTable({
  items,
  isPending,
  isError,
  errorMessage,
}: SecurityAuditLogTableProps) {
  if (isPending) {
    return (
      <div className="settings-loading">
        <LoadingSpinner label="Loading audit…" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="settings-hint">
        Recent API key audit unavailable ({errorMessage ?? 'error'}).
      </p>
    )
  }

  if (items.length === 0) {
    return <p className="settings-hint">No recent API key audit events.</p>
  }

  return (
    <div className="settings-audit-table">
      <div className="settings-audit-table-panel">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Environment</th>
              <th>Details</th>
              <th>Actor</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const environment = getAuditLogMeta(item).environment
              return (
                <tr key={item.id ?? `${item.action}-${item.createdAt}-${index}`}>
                  <td className="settings-audit-td-action">
                    {formatAuditAction(item.action)}
                  </td>
                  <td>
                    {environment ? (
                      <span className={environmentPillClass(environment)}>
                        <i aria-hidden />
                        {environment === 'live'
                          ? 'Live'
                          : environment === 'test'
                            ? 'Test'
                            : environment}
                      </span>
                    ) : (
                      <span className="settings-audit-td-muted">—</span>
                    )}
                  </td>
                  <td className="settings-audit-td-details">
                    {formatDetails(item)}
                  </td>
                  <td className="settings-audit-td-muted">
                    {item.actorEmail ?? '—'}
                  </td>
                  <td className="settings-audit-td-muted">
                    {formatAuditDate(item.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
