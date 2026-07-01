import { z } from 'zod'

export const merchantMarketSchema = z.enum([
  'bangladesh',
  'india',
  'europe',
  'brazil',
])

export const marketEntitlementStatusSchema = z.enum([
  'disabled',
  'requested',
  'kyb_in_review',
  'approved',
  'suspended',
])

export const marketKybStatusSchema = z.enum([
  'not_started',
  'pending',
  'verified',
  'rejected',
])

export const walletActivationStatusSchema = z.enum([
  'active',
  'not_enabled',
  'pending_kyb',
  'suspended',
])

export const portalMarketRowSchema = z.object({
  market: merchantMarketSchema,
  entitlementStatus: marketEntitlementStatusSchema,
  kybStatus: marketKybStatusSchema,
  requestedAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  settlementCurrencies: z.array(z.string().min(1)),
})

export const portalMarketsResponseSchema = z.object({
  items: z.array(portalMarketRowSchema),
})

export type MerchantMarket = z.infer<typeof merchantMarketSchema>
export type MarketEntitlementStatus = z.infer<typeof marketEntitlementStatusSchema>
export type MarketKybStatus = z.infer<typeof marketKybStatusSchema>
export type WalletActivationStatus = z.infer<typeof walletActivationStatusSchema>
export type PortalMarketRow = z.infer<typeof portalMarketRowSchema>
export type PortalMarketsResponse = z.infer<typeof portalMarketsResponseSchema>
