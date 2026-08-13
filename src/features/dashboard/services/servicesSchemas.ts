import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'
import {
  portalUnlockBlockerSchema,
  portalUnlockReasonSchema,
} from './portalDepthSchemas.ts'
import { merchantMarketSchema } from './marketSchemas.ts'

export const portalServiceItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    market: merchantMarketSchema.or(z.string()).optional(),
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

export const portalServicesResponseSchema = z.object({
  items: z.array(portalServiceItemSchema),
  environment: portalEnvironmentSchema.optional(),
})

export type PortalServiceItem = z.infer<typeof portalServiceItemSchema>
export type PortalServicesResponse = z.infer<typeof portalServicesResponseSchema>
