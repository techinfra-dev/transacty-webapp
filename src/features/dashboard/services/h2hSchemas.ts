import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'
import { transactionDetailSchema } from './transactionsSchemas.ts'

export const h2hPayinCreatePayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  amount: z.string().min(1),
  currency: z.string().min(1).optional(),
  customerWalletId: z.string().min(1).optional(),
  platformOrderId: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const h2hPayinInstanceSchema = z
  .object({
    transactionId: z.string().min(1),
    status: z.string().min(1).optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    paymentInstructions: z.unknown().optional(),
    expiresAt: z.string().nullable().optional(),
    transaction: transactionDetailSchema.optional(),
  })
  .passthrough()

export const h2hBuyerConfirmPayloadSchema = z.object({
  environment: portalEnvironmentSchema.optional(),
  transactionId: z.string().min(1),
})

export type H2hPayinCreatePayload = z.infer<typeof h2hPayinCreatePayloadSchema>
export type H2hPayinInstance = z.infer<typeof h2hPayinInstanceSchema>
export type H2hBuyerConfirmPayload = z.infer<typeof h2hBuyerConfirmPayloadSchema>
