import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const cpgPayoutBeneficiaryDetailsSchema = z.object({
  beneficiaryName: z.string().min(1, 'Beneficiary name is required.'),
})

export const createCpgPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  settledCurrency: z.literal('USDT'),
  // Collected at submit time by the PIN prompt — never persisted client-side.
  pin: z.string().regex(PAYOUT_PIN_PATTERN).optional(),
  networkSymbol: z.string().min(1, 'Network is required.'),
  address: z.string().min(1, 'Wallet address is required.'),
  beneficiaryDetails: cpgPayoutBeneficiaryDetailsSchema,
})

export const cpgPayoutInstanceSchema = z
  .object({
    transactionId: z.string(),
    status: z.string().optional(),
    amount: z.string().optional(),
    settlementCurrency: z.string().optional(),
    platformOrderId: z.string().optional(),
    networkSymbol: z.string().optional(),
    environment: payoutEnvironmentSchema.optional(),
    feeAmount: z.string().optional(),
    feeCurrency: z.string().optional(),
    netAmount: z.string().optional(),
    debitAmount: z.string().optional(),
    feeBreakdown: z.unknown().optional(),
    detailsSource: z.string().optional(),
    upstream: z.unknown().optional(),
  })
  .passthrough()

export type CpgPayoutBeneficiaryDetails = z.infer<
  typeof cpgPayoutBeneficiaryDetailsSchema
>
export type CreateCpgPayoutPayload = z.infer<typeof createCpgPayoutPayloadSchema>
export type CpgPayoutInstance = z.infer<typeof cpgPayoutInstanceSchema>
