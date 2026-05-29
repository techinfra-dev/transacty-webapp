import { z } from 'zod'
import { portalEnvironmentResponseSchema } from './walletsSchemas.ts'

export const balanceLimitsSchema = z.object({
  payin: z.object({
    min: z.number(),
    max: z.number(),
  }),
  payout: z.object({
    min: z.number(),
    max: z.number(),
  }),
})

export const balanceWalletItemSchema = z.object({
  id: z.string().min(1),
  currency: z.string().min(1),
  balance: z.string(),
  availableBalance: z.string(),
  pendingBalance: z.string(),
  status: z.string().min(1),
  label: z.string().nullish(),
  displayLabel: z.string().nullish(),
  region: z.string().nullish(),
  regionLabel: z.string().nullish(),
  lastUpdated: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  limits: balanceLimitsSchema,
})

export const balanceResponseSchema = z.object({
  balance: z.string(),
  availableBalance: z.string(),
  pendingBalance: z.string(),
  currency: z.string().min(1),
  lastUpdated: z.string().min(1),
  limits: balanceLimitsSchema,
  environment: portalEnvironmentResponseSchema,
  items: z.array(balanceWalletItemSchema),
})

export type BalanceLimits = z.infer<typeof balanceLimitsSchema>
export type BalanceWalletItem = z.infer<typeof balanceWalletItemSchema>
export type BalanceResponse = z.infer<typeof balanceResponseSchema>
