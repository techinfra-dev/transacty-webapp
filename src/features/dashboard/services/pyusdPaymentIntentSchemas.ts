import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'

export const createPyusdPaymentIntentPayloadSchema = z.object({
  environment: z.literal('live'),
  amount: z.string().min(1),
  merchantReference: z.string().min(1).optional(),
  expiresInMinutes: z.number().int().positive().max(24 * 60).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const pyusdPaymentIntentSchema = z
  .object({
    transactionId: z.string().min(1).optional(),
    paymentIntentId: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    settlementCurrency: z.string().optional(),
    settlementCurrencyLabel: z.string().optional(),
    network: z.string().optional(),
    depositAddress: z.string().optional(),
    expiresAt: z.string().nullable().optional(),
    merchantReference: z.string().nullable().optional(),
    environment: portalEnvironmentSchema.optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (!value.transactionId && !value.paymentIntentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment intent is missing transactionId/paymentIntentId',
      })
    }
  })

export type CreatePyusdPaymentIntentPayload = z.infer<
  typeof createPyusdPaymentIntentPayloadSchema
>
export type PyusdPaymentIntent = z.infer<typeof pyusdPaymentIntentSchema>

export function getPyusdPaymentIntentId(intent: PyusdPaymentIntent) {
  return intent.transactionId?.trim() || intent.paymentIntentId?.trim() || ''
}
