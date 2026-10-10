import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'
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

export const createKePayoutPayloadSchema = z
  .object({
    environment: payoutEnvironmentSchema,
    amount: z
      .string()
      .min(1, 'Amount is required.')
      .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
    accountNumber: kenyaMsisdnSchema,
    accountName: z.string().trim().min(1, 'Recipient name is required.'),
    confirmAccountNumber: kenyaMsisdnSchema,
    description: z.string().trim().min(1).optional(),
    merchantReference: z.string().trim().min(1).optional(),
    pin: z.string().regex(PAYOUT_PIN_PATTERN).optional(),
  })
  .refine(
    (data) => data.confirmAccountNumber === data.accountNumber,
    {
      message: 'M-Pesa number and confirmation do not match.',
      path: ['confirmAccountNumber'],
    },
  )

export const kePayoutFeeQuoteSchema = z
  .object({
    amount: z.string().optional(),
    feeAmount: z.string().nullable().optional(),
    feeCurrency: z.string().nullable().optional(),
    netAmount: z.string().nullable().optional(),
    debitAmount: z.string().nullable().optional(),
    currency: z.string().optional(),
    message: z.string().nullable().optional(),
  })
  .passthrough()

export const kePayoutInstanceSchema = z
  .object({
    transactionId: z.string(),
    reference: z.string().optional(),
    status: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    merchantReference: z.string().nullable().optional(),
    feeAmount: z.string().nullable().optional(),
    feeCurrency: z.string().nullable().optional(),
    netAmount: z.string().nullable().optional(),
    debitAmount: z.string().nullable().optional(),
    feeBreakdown: z.unknown().optional(),
    recipient: z
      .object({ masked: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
    environment: payoutEnvironmentSchema.optional(),
  })
  .passthrough()

export type CreateKePayoutPayload = z.infer<typeof createKePayoutPayloadSchema>
export type KePayoutFeeQuote = z.infer<typeof kePayoutFeeQuoteSchema>
export type KePayoutInstance = z.infer<typeof kePayoutInstanceSchema>

export type KePayoutFormPayload = {
  amount: string
  accountNumber: string
  confirmAccountNumber: string
  accountName: string
  description: string
  merchantReference: string
}
