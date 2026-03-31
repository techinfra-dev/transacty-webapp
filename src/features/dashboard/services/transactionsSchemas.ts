import { z } from 'zod'

export const portalEnvironmentSchema = z.enum(['test', 'live'])

export const transactionTypeSchema = z.enum([
  'payin',
  'payout',
  'transfer',
  'refund',
])

export const transactionStatusSchema = z.enum(['pending', 'success', 'failed'])

export const transactionItemSchema = z.object({
  id: z.string().min(1),
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  amount: z.string(),
  paidAmount: z.string().nullable().optional(),
  platformOrderId: z.string().nullable().optional(),
  customerWalletId: z.string().nullable().optional(),
  refundOfTransactionId: z.string().nullable().optional(),
  createdAt: z.string().min(1),
  completedAt: z.string().nullable().optional(),
})

export const transactionsListResponseSchema = z.object({
  items: z.array(transactionItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export const transactionDetailSchema = transactionItemSchema
  .extend({
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough()

export const createTransferPayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  customerWalletId: z.string().min(1),
  amount: z.string().min(1),
  reason: z.string().min(1).optional(),
})

export const createRefundPayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  customerWalletId: z.string().min(1),
  amount: z.string().min(1),
  refundOfTransactionId: z.string().min(1),
  reason: z.string().min(1).optional(),
})

export type TransactionType = z.infer<typeof transactionTypeSchema>
export type TransactionStatus = z.infer<typeof transactionStatusSchema>
export type TransactionItem = z.infer<typeof transactionItemSchema>
export type TransactionsListResponse = z.infer<typeof transactionsListResponseSchema>
export type TransactionDetail = z.infer<typeof transactionDetailSchema>
export type CreateTransferPayload = z.infer<typeof createTransferPayloadSchema>
export type CreateRefundPayload = z.infer<typeof createRefundPayloadSchema>
