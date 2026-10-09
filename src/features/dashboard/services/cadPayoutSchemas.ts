import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const cadPayoutRailSchema = z.enum(['bank', 'interac_email', 'bill'])

export const cadBankBeneficiarySchema = z.object({
  institutionNumber: z
    .string()
    .trim()
    .regex(/^\d{3}$/, 'Institution number is 3 digits.'),
  transitNumber: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Transit number is 5 digits.'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{5,12}$/, 'Enter a valid Canadian account number.'),
  accountName: z.string().trim().min(1, 'Account name is required.'),
})

export const cadInteracBeneficiarySchema = z.object({
  email: z.string().trim().pipe(z.email('Enter a valid email address.')),
  name: z.string().trim().min(1, 'Recipient name is required.'),
  securityQuestion: z.string().trim().min(1, 'Security question is required.'),
  securityAnswer: z.string().trim().min(1, 'Security answer is required.'),
})

export const cadBillBeneficiarySchema = z.object({
  billerId: z.string().trim().min(1, 'Select a biller.'),
  accountNumber: z.string().trim().min(1, 'Biller account number is required.'),
})

const cadPayoutSharedFields = {
  environment: payoutEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  merchantReference: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  pin: z.string().regex(PAYOUT_PIN_PATTERN).optional(),
}

export const createCadPayoutPayloadSchema = z.discriminatedUnion('rail', [
  z.object({
    ...cadPayoutSharedFields,
    rail: z.literal('bank'),
    bank: cadBankBeneficiarySchema,
  }),
  z.object({
    ...cadPayoutSharedFields,
    rail: z.literal('interac_email'),
    interac: cadInteracBeneficiarySchema,
  }),
  z.object({
    ...cadPayoutSharedFields,
    rail: z.literal('bill'),
    bill: cadBillBeneficiarySchema,
  }),
])

export const verifyCadBankPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  institutionNumber: z.string().trim().min(1),
  transitNumber: z.string().trim().min(1),
  accountNumber: z.string().trim().min(1),
  accountName: z.string().trim().min(1),
})

export const cadBankVerificationSchema = z
  .object({
    accountName: z.string().nullable().optional(),
    valid: z.boolean().optional(),
    matched: z.boolean().optional(),
    message: z.string().nullable().optional(),
  })
  .passthrough()

export const cadBillerSchema = z
  .object({
    billerId: z.string().min(1),
    name: z.string().min(1).optional(),
    billerName: z.string().min(1).optional(),
  })
  .passthrough()
  .transform((item) => ({
    ...item,
    name: item.name ?? item.billerName ?? item.billerId,
  }))

export const cadBillsSearchResponseSchema = z
  .object({ items: z.array(cadBillerSchema) })
  .passthrough()
  .or(z.array(cadBillerSchema))

export const cadPayoutInstanceSchema = z
  .object({
    transactionId: z.string(),
    reference: z.string().optional(),
    status: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    rail: cadPayoutRailSchema.or(z.string()).optional(),
    merchantReference: z.string().nullable().optional(),
    feeAmount: z.string().nullable().optional(),
    feeCurrency: z.string().nullable().optional(),
    netAmount: z.string().nullable().optional(),
    recipient: z
      .object({ masked: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
    environment: payoutEnvironmentSchema.optional(),
  })
  .passthrough()

export type CadPayoutRail = z.infer<typeof cadPayoutRailSchema>
export type CadBankBeneficiary = z.infer<typeof cadBankBeneficiarySchema>
export type CreateCadPayoutPayload = z.infer<typeof createCadPayoutPayloadSchema>
export type VerifyCadBankPayload = z.infer<typeof verifyCadBankPayloadSchema>
export type CadBankVerification = z.infer<typeof cadBankVerificationSchema>
export type CadBiller = z.infer<typeof cadBillerSchema>
export type CadPayoutInstance = z.infer<typeof cadPayoutInstanceSchema>

export type CadPayoutFormPayload = {
  amount: string
  merchantReference: string
  description: string
  rail: CadPayoutRail
  bank: {
    institutionNumber: string
    transitNumber: string
    accountNumber: string
    accountName: string
  }
  interac: {
    email: string
    name: string
    securityQuestion: string
    securityAnswer: string
  }
  bill: {
    billerId: string
    billerName: string
    accountNumber: string
  }
}
