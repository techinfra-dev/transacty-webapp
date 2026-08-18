import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'
import { portalMarketRowSchema } from './marketSchemas.ts'
import { portalUnlockBlockerSchema, portalUnlockReasonSchema } from './portalDepthSchemas.ts'

export const portalServiceItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    market: z.string().optional(),
    rail: z.string().min(1).optional(),
    environment: portalEnvironmentSchema.optional(),
    status: z.string().min(1).optional(),
    activationStatus: z.string().min(1).optional(),
    canRequest: z.boolean().optional(),
    ready: z.boolean().optional(),
    unlockReason: portalUnlockReasonSchema.nullable().optional(),
    blockers: z.array(portalUnlockBlockerSchema).optional(),
    walletsProvisioned: z.boolean().optional(),
  })
  .passthrough()

export const portalServicesResponseSchema = z
  .object({
    environment: portalEnvironmentSchema.optional(),
    globalKycStatus: z.string().min(1).optional(),
    markets: z.array(portalMarketRowSchema).optional(),
    wallets: z.array(z.record(z.string(), z.unknown())).optional(),
    items: z.array(portalServiceItemSchema).optional(),
  })
  .passthrough()

export type PortalServiceItem = z.infer<typeof portalServiceItemSchema>
export type PortalServicesResponse = z.infer<typeof portalServicesResponseSchema>
