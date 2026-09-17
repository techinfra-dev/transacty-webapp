import { z } from 'zod'

/**
 * 202 from payout create when a second approval is required.
 * This is a success state — not a failed create.
 */
export const payoutQueuedApprovalSchema = z
  .object({
    requestId: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    status: z.string().optional(),
    requiresApproval: z.literal(true),
    expiresAt: z.string().nullable().optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!value.requestId?.trim() && !value.id?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Queued payout approval is missing requestId.',
      })
    }
  })

export type PayoutQueuedApproval = z.infer<typeof payoutQueuedApprovalSchema>

export type PayoutCreateResult<TCreated> =
  | { kind: 'created'; payout: TCreated }
  | { kind: 'queued'; approval: PayoutQueuedApproval }

export function getPayoutQueuedApprovalId(approval: PayoutQueuedApproval) {
  return (approval.requestId ?? approval.id ?? '').trim()
}

function hasCreatedTransactionId(data: unknown) {
  if (!data || typeof data !== 'object') {
    return false
  }
  const transactionId = (data as { transactionId?: unknown }).transactionId
  return typeof transactionId === 'string' && transactionId.trim().length > 0
}

export function parsePayoutCreateResponse<TCreated>(
  data: unknown,
  createdSchema: { parse: (value: unknown) => TCreated },
  httpStatus?: number,
): PayoutCreateResult<TCreated> {
  if (httpStatus === 202) {
    return {
      kind: 'queued',
      approval: payoutQueuedApprovalSchema.parse(data),
    }
  }
  if (httpStatus === 201) {
    return { kind: 'created', payout: createdSchema.parse(data) }
  }

  const queued = payoutQueuedApprovalSchema.safeParse(data)
  if (queued.success && !hasCreatedTransactionId(data)) {
    return { kind: 'queued', approval: queued.data }
  }
  return { kind: 'created', payout: createdSchema.parse(data) }
}
