import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const ngnBankSchema = z
  .object({
    bankCode: z.string().min(1),
    bankName: z.string().min(1),
  })
  .passthrough()

export const ngnBanksResponseSchema = z
  .object({ items: z.array(ngnBankSchema) })
  .passthrough()
  .or(z.array(ngnBankSchema))

export const verifyNgnAccountPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Nigerian account numbers are 10 digits.'),
  bankCode: z.string().trim().min(1, 'Select the beneficiary bank.'),
})

export const ngnAccountVerificationSchema = z
  .object({
    accountName: z.string().nullable().optional(),
    accountNumber: z.string().nullable().optional(),
    bankCode: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
  })
  .passthrough()

export const ngnPayoutBeneficiarySchema = z.object({
  accountNumber: z.string().min(1),
  bankCode: z.string().min(1),
  accountName: z.string().min(1),
  bankName: z.string().min(1),
})

export const createNgnPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  merchantReference: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  // Collected at submit time by the PIN prompt — never persisted client-side.
  pin: z.string().regex(PAYOUT_PIN_PATTERN).optional(),
  beneficiary: ngnPayoutBeneficiarySchema,
})

export const ngnPayoutInstanceSchema = z
  .object({
    transactionId: z.string(),
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

export type NgnBank = z.infer<typeof ngnBankSchema>
export type VerifyNgnAccountPayload = z.infer<typeof verifyNgnAccountPayloadSchema>
export type NgnAccountVerification = z.infer<typeof ngnAccountVerificationSchema>
export type CreateNgnPayoutPayload = z.infer<typeof createNgnPayoutPayloadSchema>
export type NgnPayoutInstance = z.infer<typeof ngnPayoutInstanceSchema>

/** Wizard form state — environment is added at submit time. */
export type NgnPayoutFormPayload = {
  amount: string
  bankCode: string
  bankName: string
  accountNumber: string
  /** Resolved by name enquiry; empty until the account is verified. */
  accountName: string
  merchantReference: string
  description: string
}
