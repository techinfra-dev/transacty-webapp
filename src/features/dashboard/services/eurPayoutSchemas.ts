import { z } from 'zod'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/
const dobPattern = /^\d{4}-\d{2}-\d{2}$/

export const eurPayoutUserDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Enter a valid email address.'),
  country: z.string().min(1, 'Country is required.'),
  dob: z
    .string()
    .regex(dobPattern, 'Date of birth must use YYYY-MM-DD format.'),
})

export const eurPayoutPayeeDetailsSchema = z.object({
  iban: z
    .string()
    .min(15, 'Enter a valid IBAN.')
    .max(34, 'Enter a valid IBAN.')
    .transform((value) => value.replace(/\s+/g, '').toUpperCase()),
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
})

export const createEurPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  currencySymbol: z.literal('EUR'),
  returnUrl: z.string().url('Return URL is required.'),
  merchantUrl: z.string().url('Merchant URL is required.'),
  userDetails: eurPayoutUserDetailsSchema,
  payeeDetails: eurPayoutPayeeDetailsSchema,
  autoMerchantApproval: z.union([z.literal(0), z.literal(1)]),
})

export const eurPayoutFeesSchema = z
  .object({
    platformFee: z.string().optional(),
    feeType: z.string().optional(),
    feeStatus: z.string().optional(),
  })
  .passthrough()

export const eurPayoutInstanceSchema = z
  .object({
    transactionId: z.string(),
    status: z.string().optional(),
    environment: payoutEnvironmentSchema.optional(),
    amount: z.string().optional(),
    currencySymbol: z.string().optional(),
    settlementCurrency: z.string().optional(),
    checkoutUrl: z.string().url().optional(),
    cryptoAmount: z.string().optional(),
    rate: z.union([z.string(), z.number()]).optional(),
    fiatCurrency: z.string().optional(),
    debitAmount: z.string().optional(),
    fees: eurPayoutFeesSchema.optional(),
    totalWalletDebit: z.string().optional(),
    requiresMerchantApproval: z.boolean().optional(),
    merchantApprovalStatus: z.string().optional(),
    createdAt: z.string().optional(),
    completedAt: z.string().nullable().optional(),
  })
  .passthrough()

export type EurPayoutUserDetails = z.infer<typeof eurPayoutUserDetailsSchema>
export type EurPayoutPayeeDetails = z.infer<typeof eurPayoutPayeeDetailsSchema>
export type CreateEurPayoutPayload = z.infer<typeof createEurPayoutPayloadSchema>
export type EurPayoutInstance = z.infer<typeof eurPayoutInstanceSchema>

export const eurPayoutApproveResponseSchema = z
  .object({
    transactionId: z.string(),
    acknowledged: z.boolean().optional(),
    environment: payoutEnvironmentSchema.optional(),
  })
  .passthrough()

export type EurPayoutApproveResponse = z.infer<typeof eurPayoutApproveResponseSchema>
