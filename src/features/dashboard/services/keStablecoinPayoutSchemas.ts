import { z } from 'zod'
import { PAYOUT_PIN_PATTERN } from './payoutPinSchemas.ts'
import { payoutEnvironmentSchema } from './payoutsSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const keStablecoinCurrencySchema = z.enum(['USDT', 'USDC'])
export const keStablecoinChainSchema = z.enum(['tron', 'ethereum'])

export const createKeStablecoinQuotePayloadSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  currency: keStablecoinCurrencySchema,
})

export const keStablecoinQuoteSchema = z
  .object({
    quoteId: z.string().min(1),
    pair: z.string().optional(),
    sourceAmount: z.string().optional(),
    destinationAmount: z.string().optional(),
    rate: z.string().nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    currency: keStablecoinCurrencySchema.or(z.string()).optional(),
  })
  .passthrough()

export const createKeStablecoinPayoutPayloadSchema = z.object({
  quoteId: z.string().trim().min(1, 'Get a fresh quote before confirming.'),
  destination: z.object({
    currency: keStablecoinCurrencySchema,
    recipientAddress: z
      .string()
      .trim()
      .min(8, 'Enter the destination wallet address.'),
    chain: keStablecoinChainSchema.optional(),
  }),
  beneficiary: z.object({
    accountHolderName: z
      .string()
      .trim()
      .min(1, 'Beneficiary name is required.'),
  }),
  narration: z.string().trim().min(1).optional(),
  pin: z.string().regex(PAYOUT_PIN_PATTERN).optional(),
  environment: payoutEnvironmentSchema.optional(),
})

export const keStablecoinPayoutInstanceSchema = z
  .object({
    transactionId: z.string().min(1),
    status: z.string().optional(),
    withdrawalStatus: z.string().nullable().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    destinationCurrency: z.string().optional(),
    destinationAmountGross: z.string().nullable().optional(),
    destinationAmountNet: z.string().nullable().optional(),
    feeAmount: z.string().nullable().optional(),
    feeCurrency: z.string().nullable().optional(),
    netAmount: z.string().nullable().optional(),
    debitAmount: z.string().nullable().optional(),
    feeBreakdown: z.unknown().optional(),
    needsManualReview: z.boolean().optional(),
    environment: payoutEnvironmentSchema.optional(),
  })
  .passthrough()

export type KeStablecoinCurrency = z.infer<typeof keStablecoinCurrencySchema>
export type KeStablecoinChain = z.infer<typeof keStablecoinChainSchema>
export type CreateKeStablecoinQuotePayload = z.infer<
  typeof createKeStablecoinQuotePayloadSchema
>
export type KeStablecoinQuote = z.infer<typeof keStablecoinQuoteSchema>
export type CreateKeStablecoinPayoutPayload = z.infer<
  typeof createKeStablecoinPayoutPayloadSchema
>
export type KeStablecoinPayoutInstance = z.infer<
  typeof keStablecoinPayoutInstanceSchema
>

export function defaultChainForStablecoin(
  currency: KeStablecoinCurrency,
): KeStablecoinChain {
  return currency === 'USDC' ? 'ethereum' : 'tron'
}
