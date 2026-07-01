import { z } from 'zod'
import {
  beneficiaryAccountInfoSchema,
  cardHolderInfoSchema,
  payoutEnvironmentSchema,
} from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const createBrPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema.default('test'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  benificiaryAccountInfo: beneficiaryAccountInfoSchema,
  cardHolderInfo: cardHolderInfoSchema,
})

export const brPayoutRecipientSchema = z
  .object({
    masked: z.string().optional(),
    benificiaryAccountInfo: beneficiaryAccountInfoSchema.partial().optional(),
  })
  .passthrough()

export const createBrPayoutResponseSchema = z
  .object({
    reference: z.string().optional(),
    transactionId: z.string().optional(),
    id: z.string().optional(),
    status: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    recipient: brPayoutRecipientSchema.optional(),
    message: z.string().optional(),
  })
  .passthrough()

export type CreateBrPayoutPayload = z.infer<typeof createBrPayoutPayloadSchema>
export type BrPayoutResponse = z.infer<typeof createBrPayoutResponseSchema>
