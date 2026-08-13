import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'
import { transactionRailApiSchema } from './transactionsSchemas.ts'

export const moneyRailOverviewItemSchema = z
  .object({
    rail: transactionRailApiSchema.or(z.string()),
    displayName: z.string().optional(),
    payinCount: z.number().optional(),
    payoutCount: z.number().optional(),
    pendingCount: z.number().optional(),
    canCreatePayin: z.boolean().optional(),
    canCreatePayout: z.boolean().optional(),
    createPayinPath: z.string().optional(),
    createPayoutPath: z.string().optional(),
    integrationHint: z.string().nullable().optional(),
  })
  .passthrough()

export const moneyOverviewResponseSchema = z
  .object({
    environment: portalEnvironmentSchema.optional(),
    rails: z.array(moneyRailOverviewItemSchema).optional(),
    items: z.array(moneyRailOverviewItemSchema).optional(),
  })
  .passthrough()

export type MoneyRailOverviewItem = z.infer<typeof moneyRailOverviewItemSchema>
export type MoneyOverviewResponse = z.infer<typeof moneyOverviewResponseSchema>
