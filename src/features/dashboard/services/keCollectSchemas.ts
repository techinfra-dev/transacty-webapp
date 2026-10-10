import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'
import {
  isValidKenyaMsisdn,
  normalizeKenyaMsisdn,
} from '../utils/kenyaMarket.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

const kenyaMsisdnSchema = z
  .string()
  .trim()
  .min(1, 'M-Pesa number is required.')
  .transform(normalizeKenyaMsisdn)
  .refine(isValidKenyaMsisdn, {
    message: 'Enter a valid Kenyan M-Pesa number (2547… or 07…).',
  })

export const createKeCollectPayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  accountNumber: kenyaMsisdnSchema,
  accountName: z.string().trim().min(1, 'Payer name is required.'),
  merchantReference: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
})

export const keCollectInstructionsSchema = z
  .object({
    content: z.string().optional(),
    type: z.string().optional(),
    message: z.string().optional(),
    instructions: z.string().optional(),
  })
  .passthrough()

export const keCollectInstanceSchema = z
  .object({
    transactionId: z.string().min(1).optional(),
    id: z.string().optional(),
    reference: z.string().optional(),
    status: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    merchantReference: z.string().nullable().optional(),
    paymentInstructions: keCollectInstructionsSchema.nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    environment: portalEnvironmentSchema.optional(),
  })
  .passthrough()

export type CreateKeCollectPayload = z.infer<typeof createKeCollectPayloadSchema>
export type KeCollectInstance = z.infer<typeof keCollectInstanceSchema>
