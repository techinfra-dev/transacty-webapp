import { z } from 'zod'

export const payoutEnvironmentSchema = z.enum(['test', 'live'])

const amountPattern = /^\d+(\.\d{1,2})?$/

export const beneficiaryAccountInfoSchema = z.object({
  number: z.string().min(1, 'Beneficiary account number is required.'),
  holderName: z.string().min(1, 'Account holder name is required.'),
  orgName: z.string().min(1, 'Organization name is required.'),
  orgCode: z.string().min(1, 'Organization code is required.'),
  orgId: z.string().min(1, 'Organization ID is required.'),
})

export const cardHolderInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(1, 'Phone number is required.'),
})

export const createPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema.default('test'),
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  // API contract currently expects this misspelled key.
  benificiaryAccountInfo: beneficiaryAccountInfoSchema,
  cardHolderInfo: cardHolderInfoSchema,
})

export const createPayoutResponseSchema = z
  .object({
    transactionId: z.string().optional(),
    id: z.string().optional(),
    status: z.string().optional(),
    amount: z.string().optional(),
    environment: payoutEnvironmentSchema.optional(),
    createdAt: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough()

export type BeneficiaryAccountInfo = z.infer<typeof beneficiaryAccountInfoSchema>
export type CardHolderInfo = z.infer<typeof cardHolderInfoSchema>
export type CreatePayoutPayload = z.infer<typeof createPayoutPayloadSchema>
export type CreatePayoutResponse = z.infer<typeof createPayoutResponseSchema>
