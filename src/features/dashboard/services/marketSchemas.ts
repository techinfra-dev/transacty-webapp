import { z } from 'zod'
import {
  portalUnlockBlockerSchema,
  portalUnlockReasonSchema,
} from './portalDepthSchemas.ts'

export const merchantMarketSchema = z.enum([
  'bangladesh',
  'india',
  'europe',
  'brazil',
  'nigeria',
  'pyusd',
])

export const marketEntitlementStatusSchema = z.enum([
  'disabled',
  'not_requested',
  'requested',
  'kyb_in_review',
  'approved',
  'rejected',
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

export const marketActivationStatusSchema = z.enum([
  'active',
  'not_enabled',
  'pending_kyb',
  'requested',
  'kyb_in_review',
  'approved',
  'suspended',
  'disabled',
])

export const portalMarketWalletSchema = z.object({
  currency: z.string().min(1).optional(),
  activationStatus: walletActivationStatusSchema.optional(),
  unlockReason: portalUnlockReasonSchema.nullable().optional(),
  blockers: z.array(portalUnlockBlockerSchema).optional(),
}).passthrough()

export const portalMarketRowSchema = z
  .object({
    market: merchantMarketSchema,
    displayName: z.string().min(1).optional(),
    entitlementStatus: marketEntitlementStatusSchema,
    kybStatus: marketKybStatusSchema,
    activationStatus: marketActivationStatusSchema.optional(),
    canRequest: z.boolean().optional(),
    ready: z.boolean().optional(),
    unlockReason: portalUnlockReasonSchema.nullable().optional(),
    blockers: z.array(portalUnlockBlockerSchema).optional(),
    walletsProvisioned: z.boolean().optional(),
    wallets: z.array(portalMarketWalletSchema).optional(),
    requestedAt: z.string().nullable(),
    approvedAt: z.string().nullable(),
    settlementCurrencies: z.array(z.string().min(1)),
  })
  .passthrough()

export const portalMarketsResponseSchema = z
  .object({
    globalKycStatus: z.string().min(1).optional(),
    items: z.array(portalMarketRowSchema),
  })
  .passthrough()

export type MerchantMarket = z.infer<typeof merchantMarketSchema>
export type MarketEntitlementStatus = z.infer<typeof marketEntitlementStatusSchema>
export type MarketKybStatus = z.infer<typeof marketKybStatusSchema>
export type WalletActivationStatus = z.infer<typeof walletActivationStatusSchema>
export type PortalMarketRow = z.infer<typeof portalMarketRowSchema>
export type PortalMarketsResponse = z.infer<typeof portalMarketsResponseSchema>
