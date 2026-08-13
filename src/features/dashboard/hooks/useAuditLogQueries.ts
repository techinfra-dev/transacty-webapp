import { useMutation, useQuery } from '@tanstack/react-query'
import {
  exportAuditLogCsv,
  listAuditLog,
} from '../services/auditLogService.ts'
import { prepareAdminStepUp } from '../utils/prepareSensitiveMutation.ts'

export function useAuditLogQuery(
  params: { actionPrefix?: string; limit?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      'portal-audit-log',
      params.actionPrefix ?? null,
      params.limit ?? 20,
    ],
    queryFn: () =>
      listAuditLog({
        limit: params.limit ?? 20,
        offset: 0,
        actionPrefix: params.actionPrefix,
      }),
    enabled,
    staleTime: 30_000,
  })
}

export function useExportAuditLogCsvMutation() {
  return useMutation({
    mutationFn: async (params: { actionPrefix?: string } = {}) => {
      const { stepUpToken } = await prepareAdminStepUp('audit.export')
      const blob = await exportAuditLogCsv({
        stepUpToken,
        actionPrefix: params.actionPrefix,
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    },
  })
}

export function useSecurityAuditLogQuery(enabled = true) {
  return useAuditLogQuery({ actionPrefix: 'portal.api_key.', limit: 10 }, enabled)
}
