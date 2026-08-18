import type { SecurityOverviewResponse } from '../../services/securityOverviewSchemas.ts'
import {
  formatAuditAction,
  formatAuditDate,
} from '../../utils/auditDisplayUtils.ts'

type RecentSecurityRow = NonNullable<
  SecurityOverviewResponse['recentSecurityAudit']
>[number]

interface SecurityRecentActivityTableProps {
  items: RecentSecurityRow[]
}

export function SecurityRecentActivityTable({
  items,
}: SecurityRecentActivityTableProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="settings-recent-activity">
      <p className="settings-recent-activity-label">Recent activity</p>
      <div className="settings-audit-table-panel settings-audit-table-panel--compact">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Actor</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => (
              <tr key={row.id ?? `${row.action}-${row.createdAt}-${index}`}>
                <td className="settings-audit-td-action">
                  {formatAuditAction(row.action)}
                </td>
                <td className="settings-audit-td-muted">
                  {row.actorEmail ?? '—'}
                </td>
                <td className="settings-audit-td-muted">
                  {formatAuditDate(row.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
