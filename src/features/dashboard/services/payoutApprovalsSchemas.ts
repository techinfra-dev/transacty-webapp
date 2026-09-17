import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

export const payoutApprovalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'expired',
])

export const payoutApprovalItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    requestId: z.string().min(1).optional(),
    status: z.string().optional(),
    rail: z.string().optional(),
    market: z.string().optional(),
    amount: z.union([z.string(), z.number()]).optional(),
    currency: z.string().optional(),
    environment: payoutEnvironmentSchema.or(z.string()).optional(),
    requiresApproval: z.boolean().optional(),
    expiresAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    // Known gap: these are merchant-user UUIDs, not emails. Do not look them up.
    requestedBy: z.string().nullable().optional(),
    approvedBy: z.string().nullable().optional(),
    rejectedBy: z.string().nullable().optional(),
    reason: z.string().nullable().optional(),
  })
  .passthrough()

export const payoutApprovalsListResponseSchema = z
  .object({
    items: z.array(payoutApprovalItemSchema).optional(),
    data: z.array(payoutApprovalItemSchema).optional(),
    approvals: z.array(payoutApprovalItemSchema).optional(),
    total: z.number().optional(),
  })
  .passthrough()
  .or(z.array(payoutApprovalItemSchema))

export const approvePayoutApprovalPayloadSchema = z.object({
  pin: z.string().regex(PAYOUT_PIN_PATTERN),
})

export const rejectPayoutApprovalPayloadSchema = z.object({
  reason: z.string().trim().min(1, 'Enter a reason for rejecting this payout.'),
})

export type PayoutApprovalStatus = z.infer<typeof payoutApprovalStatusSchema>
export type PayoutApprovalItem = z.infer<typeof payoutApprovalItemSchema>
export type ApprovePayoutApprovalPayload = z.infer<
  typeof approvePayoutApprovalPayloadSchema
>
export type RejectPayoutApprovalPayload = z.infer<
  typeof rejectPayoutApprovalPayloadSchema
>

export function getPayoutApprovalId(item: PayoutApprovalItem) {
  return (item.id ?? item.requestId ?? '').trim()
}

export function parsePayoutApprovalsList(data: unknown): PayoutApprovalItem[] {
  const parsed = payoutApprovalsListResponseSchema.parse(data)
  if (Array.isArray(parsed)) {
    return parsed
  }
  return parsed.items ?? parsed.data ?? parsed.approvals ?? []
}

export function unwrapPayoutApprovalPayload(data: unknown) {
  if (!data || typeof data !== 'object') {
    return data
  }
  const record = data as Record<string, unknown>
  if (
    record.data &&
    typeof record.data === 'object' &&
    !Array.isArray(record.data) &&
    !record.id &&
    !record.requestId
  ) {
    return record.data
  }
  return data
}

export function normalizePayoutApprovalStatus(status: string | undefined) {
  const value = status?.trim().toLowerCase() ?? ''
  if (
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'expired'
  ) {
    return value
  }
  return value || 'pending'
}
