import { z } from 'zod'
import { portalEnvironmentSchema } from './transactionsSchemas.ts'

export const reconciliationRowSchema = z.object({
  transactionId: z.string(),
  type: z.string(),
  status: z.string(),
  amount: z.string(),
  paidAmount: z.string().nullable().optional(),
  currency: z.string(),
  rail: z.string().optional(),
  railLabel: z.string().optional(),
  platformOrderId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
})

export const reconciliationVolumeByCurrencySchema = z.object({
  currency: z.string(),
  amount: z.string(),
})

export const reconciliationSummarySchema = z.object({
  totalTransactions: z.number().optional(),
  payinCount: z.number().optional(),
  payoutCount: z.number().optional(),
  successCount: z.number().optional(),
  failedCount: z.number().optional(),
  pendingCount: z.number().optional(),
  payinVolumeByCurrency: z.array(reconciliationVolumeByCurrencySchema).optional(),
  payoutVolumeByCurrency: z.array(reconciliationVolumeByCurrencySchema).optional(),
})

export const reconciliationReportResponseSchema = z.object({
  merchantId: z.string().optional(),
  environment: portalEnvironmentSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  summary: reconciliationSummarySchema.optional(),
  rows: z.array(reconciliationRowSchema),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type ReconciliationRow = z.infer<typeof reconciliationRowSchema>
export type ReconciliationVolumeByCurrency = z.infer<
  typeof reconciliationVolumeByCurrencySchema
>
export type ReconciliationSummary = z.infer<typeof reconciliationSummarySchema>
export type ReconciliationReportResponse = z.infer<
  typeof reconciliationReportResponseSchema
>
