import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'
import { merchantMarketSchema } from './marketSchemas.ts'

export const moneyRailStatusCountsSchema = z.object({
  pending: z.number(),
  success: z.number(),
  failed: z.number(),
  total: z.number(),
})

export const moneyRailCapabilitiesSchema = z.object({
  canCreatePayin: z.boolean(),
  canCreatePayout: z.boolean(),
  payinPath: z.string().nullable(),
  payoutPath: z.string().nullable(),
  statusPath: z.string().nullable(),
  integrationHint: z.string().nullable(),
})

export const moneyRailOverviewItemSchema = z.object({
  market: merchantMarketSchema.or(z.string().min(1)),
  displayName: z.string().min(1),
  ready: z.boolean(),
  unlockReason: z.string().nullable(),
  settlementCurrencies: z.array(z.string().min(1)),
  counts: z.object({
    payin: moneyRailStatusCountsSchema,
    payout: moneyRailStatusCountsSchema,
  }),
  capabilities: moneyRailCapabilitiesSchema,
  transactionsQuery: z.string().min(1),
})

export const moneyOverviewResponseSchema = z.object({
  environment: portalEnvironmentSchema,
  globalKycStatus: z.string().min(1).optional(),
  rails: z.array(moneyRailOverviewItemSchema),
})

export type MoneyRailStatusCounts = z.infer<typeof moneyRailStatusCountsSchema>
export type MoneyRailOverviewItem = z.infer<typeof moneyRailOverviewItemSchema>
export type MoneyOverviewResponse = z.infer<typeof moneyOverviewResponseSchema>
