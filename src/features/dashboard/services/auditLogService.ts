import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
import {
  auditLogListResponseSchema,
  type AuditLogListResponse,
} from './auditLogSchemas.ts'

function getAuditErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { message?: unknown; error?: unknown }
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message.trim()
    }
    if (typeof data.error === 'string' && data.error.trim().length > 0) {
      return data.error.trim()
    }
  }
  return 'Unable to load audit log right now.'
}

export async function listAuditLog(params: {
  limit?: number
  offset?: number
  action?: string
  actionPrefix?: string
} = {}): Promise<AuditLogListResponse> {
  try {
    const response = await axiosInstance.get('me/audit-log', {
      headers: getPortalAuthHeaders(),
      params,
    })
    return auditLogListResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getAuditErrorMessage(error))
  }
}

/** Downloads CSV; requires step-up `audit.export` when MFA is enabled. */
export async function exportAuditLogCsv(
  options: PortalRequestHeaderOptions & {
    action?: string
    actionPrefix?: string
  } = {},
): Promise<Blob> {
  const { stepUpToken, action, actionPrefix } = options
  try {
    const response = await axiosInstance.get('me/audit-log', {
      headers: getPortalAuthHeaders({ stepUpToken }),
      params: {
        format: 'csv',
        ...(action ? { action } : {}),
        ...(actionPrefix ? { actionPrefix } : {}),
      },
      responseType: 'blob',
    })
    return response.data as Blob
  } catch (error) {
    throw new Error(getAuditErrorMessage(error))
  }
}
