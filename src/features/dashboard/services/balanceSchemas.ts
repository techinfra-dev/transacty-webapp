import { z } from 'zod'
import {
  marketEntitlementStatusSchema,
  marketKybStatusSchema,
  merchantMarketSchema,
  walletActivationStatusSchema,
} from './marketSchemas.ts'
import {
  portalUnlockBlockerSchema,
  portalUnlockReasonSchema,
} from './portalDepthSchemas.ts'
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

export const balanceWalletItemSchema = z
  .object({
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
    lastUpdated: z.string().nullish(),
    updatedAt: z.string().nullish(),
    createdAt: z.string().nullish(),
    limits: balanceLimitsSchema.optional(),
    market: merchantMarketSchema.or(z.literal('other')).nullish(),
    entitlementStatus: marketEntitlementStatusSchema.or(z.string().min(1)).nullish(),
    kybStatus: marketKybStatusSchema.or(z.string().min(1)).nullish(),
    activationStatus: walletActivationStatusSchema.or(z.string().min(1)).nullish(),
    walletActivated: z.boolean().nullish(),
    unlockReason: portalUnlockReasonSchema.nullable().optional(),
    blockers: z.array(portalUnlockBlockerSchema).optional(),
  })
  .passthrough()

export const balanceResponseSchema = z
  .object({
    balance: z.string(),
    availableBalance: z.string(),
    pendingBalance: z.string(),
    currency: z.string().min(1),
    lastUpdated: z.string().nullish(),
    limits: balanceLimitsSchema.optional(),
    environment: portalEnvironmentResponseSchema,
    items: z.array(balanceWalletItemSchema),
  })
  .passthrough()

export type BalanceLimits = z.infer<typeof balanceLimitsSchema>
export type BalanceWalletItem = z.infer<typeof balanceWalletItemSchema>
export type BalanceResponse = z.infer<typeof balanceResponseSchema>
