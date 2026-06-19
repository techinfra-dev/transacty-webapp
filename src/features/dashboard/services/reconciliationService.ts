import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  toReconciliationApiFromParam,
  toReconciliationApiToParam,
} from '../utils/reconciliationDateUtils.ts'
import {
  reconciliationReportResponseSchema,
  type ReconciliationReportResponse,
} from './reconciliationSchemas.ts'

function formatReconciliationApiDateRange(from: string, to: string) {
  return {
    from: toReconciliationApiFromParam(from),
    to: toReconciliationApiToParam(to),
  }
}

function getReconciliationErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    if (error.response?.status === 400) {
      const responseData = error.response.data as {
        message?: unknown
        error?: unknown
      }
      const apiMessage =
        typeof responseData.message === 'string'
          ? responseData.message.trim()
          : typeof responseData.error === 'string'
            ? responseData.error.trim()
            : ''

      if (apiMessage.includes('Invalid datetime')) {
        return 'Choose valid start and end dates.'
      }

      if (apiMessage.length > 0) {
        return apiMessage
      }

      return 'Invalid date range. Maximum range is 93 days.'
    }

    if (error.response?.data) {
      const responseData = error.response.data as {
        message?: unknown
        error?: unknown
      }
      if (
        typeof responseData.message === 'string' &&
        responseData.message.trim().length > 0
      ) {
        return responseData.message
      }
      if (
        typeof responseData.error === 'string' &&
        responseData.error.trim().length > 0
      ) {
        return responseData.error
      }
    }
  }
  return 'Unable to load reconciliation report right now.'
}

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getReconciliationReport(params: {
  environment: PortalEnvironment
  from: string
  to: string
}): Promise<ReconciliationReportResponse> {
  try {
    const { from, to } = formatReconciliationApiDateRange(params.from, params.to)
    const response = await axiosInstance.get('me/reconciliation', {
      headers: getAuthHeader(),
      params: {
        environment: params.environment,
        from,
        to,
        format: 'json',
      },
    })
    return reconciliationReportResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getReconciliationErrorMessage(error))
  }
}

export async function downloadReconciliationCsv(params: {
  environment: PortalEnvironment
  from: string
  to: string
}) {
  try {
    const { from, to } = formatReconciliationApiDateRange(params.from, params.to)
    const response = await axiosInstance.get('me/reconciliation', {
      headers: getAuthHeader(),
      params: {
        environment: params.environment,
        from,
        to,
        format: 'csv',
      },
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reconciliation-${params.environment}-${params.from}-${params.to}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    throw new Error(getReconciliationErrorMessage(error))
  }
}
