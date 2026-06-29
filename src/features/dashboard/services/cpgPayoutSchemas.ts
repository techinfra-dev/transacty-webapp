import { z } from 'zod'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const cpgPayoutDestinationDetailsSchema = z.object({
  address: z.string().min(1, 'Wallet address is required.'),
  beneficiaryName: z.string().min(1, 'Beneficiary name is required.'),
})

export const createCpgPayoutPayloadSchema = z.object({
  environment: payoutEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  settledCurrency: z.literal('USDT'),
  networkSymbol: z.string().min(1, 'Network is required.'),
  destinationDetails: cpgPayoutDestinationDetailsSchema,
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

export type CpgPayoutDestinationDetails = z.infer<
  typeof cpgPayoutDestinationDetailsSchema
>
export type CreateCpgPayoutPayload = z.infer<typeof createCpgPayoutPayloadSchema>
export type CpgPayoutInstance = z.infer<typeof cpgPayoutInstanceSchema>
