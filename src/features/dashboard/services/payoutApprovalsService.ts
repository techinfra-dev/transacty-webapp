import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  getPortalAuthHeaders,
  type PortalRequestHeaderOptions,
} from '../../../api/portalAuthHeaders.ts'
import {
  getStableIdempotencyKey,
  releaseIdempotencyKey,
} from '../../../utils/idempotency.ts'
import { assertNotPayoutPinError } from '../utils/payoutPinErrors.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  approvePayoutApprovalPayloadSchema,
  getPayoutApprovalId,
  parsePayoutApprovalsList,
  payoutApprovalItemSchema,
  rejectPayoutApprovalPayloadSchema,
  unwrapPayoutApprovalPayload,
  type PayoutApprovalItem,
  type PayoutApprovalStatus,
} from './payoutApprovalsSchemas.ts'

const APPROVALS_PATH = 'me/payout-approvals'

function getPayoutApprovalApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      code?: unknown
    }
    if (
      typeof responseData.message === 'string' &&
      responseData.message.trim().length > 0
    ) {
      return responseData.message.trim()
    }
    if (
      typeof responseData.error === 'string' &&
      responseData.error.trim().length > 0
    ) {
      return responseData.error.trim()
    }
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'Unable to load payout approvals right now.'
}

export async function listPayoutApprovals(params: {
  environment: PortalEnvironment
  status?: PayoutApprovalStatus
}): Promise<PayoutApprovalItem[]> {
  try {
    const response = await axiosInstance.get(APPROVALS_PATH, {
      headers: getPortalAuthHeaders(),
      params: {
        environment: params.environment,
        ...(params.status ? { status: params.status } : {}),
      },
    })
    return parsePayoutApprovalsList(response.data)
  } catch (error) {
    throw new Error(getPayoutApprovalApiErrorMessage(error))
  }
}

export async function getPayoutApproval(params: {
  approvalId: string
  environment: PortalEnvironment
}): Promise<PayoutApprovalItem> {
  try {
    const response = await axiosInstance.get(
      `${APPROVALS_PATH}/${encodeURIComponent(params.approvalId)}`,
      {
        headers: getPortalAuthHeaders(),
        params: { environment: params.environment },
      },
    )
    return payoutApprovalItemSchema.parse(
      unwrapPayoutApprovalPayload(response.data),
    )
  } catch (error) {
    throw new Error(getPayoutApprovalApiErrorMessage(error))
  }
}

function parseApprovalWriteResponse(
  data: unknown,
  fallback: PayoutApprovalItem,
): PayoutApprovalItem {
  if (data == null || data === '') {
    return fallback
  }
  const parsed = payoutApprovalItemSchema.safeParse(
    unwrapPayoutApprovalPayload(data),
  )
  return parsed.success ? parsed.data : fallback
}

export async function approvePayoutApproval(
  params: {
    approvalId: string
    environment: PortalEnvironment
    pin: string
  },
  options: PortalRequestHeaderOptions = {},
): Promise<PayoutApprovalItem> {
  const body = approvePayoutApprovalPayloadSchema.parse({ pin: params.pin })
  const path = `${APPROVALS_PATH}/${encodeURIComponent(params.approvalId)}/approve`
  try {
    const response = await axiosInstance.post(path, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(path, {
          environment: params.environment,
          pin: body.pin,
        }),
      }),
      params: { environment: params.environment },
    })
    const updated = parseApprovalWriteResponse(response.data, {
      id: params.approvalId,
      status: 'approved',
    })
    releaseIdempotencyKey(path, {
      environment: params.environment,
      pin: body.pin,
    })
    return updated
  } catch (error) {
    assertNotPayoutPinError(error)
    throw new Error(getPayoutApprovalApiErrorMessage(error))
  }
}

export async function rejectPayoutApproval(
  params: {
    approvalId: string
    environment: PortalEnvironment
    reason: string
  },
  options: PortalRequestHeaderOptions = {},
): Promise<PayoutApprovalItem> {
  const body = rejectPayoutApprovalPayloadSchema.parse({
    reason: params.reason,
  })
  const path = `${APPROVALS_PATH}/${encodeURIComponent(params.approvalId)}/reject`
  try {
    const response = await axiosInstance.post(path, body, {
      headers: getPortalAuthHeaders({
        ...options,
        idempotencyKey: getStableIdempotencyKey(path, body),
      }),
      params: { environment: params.environment },
    })
    const updated = parseApprovalWriteResponse(response.data, {
      id: params.approvalId,
      status: 'rejected',
      reason: body.reason,
    })
    releaseIdempotencyKey(path, body)
    return updated
  } catch (error) {
    throw new Error(getPayoutApprovalApiErrorMessage(error))
  }
}

export function resolvePayoutApprovalId(item: PayoutApprovalItem) {
  return getPayoutApprovalId(item)
}
