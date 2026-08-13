import { z } from 'zod'

/** Shared unlock/blocker payload used by markets, wallets, and services. */
export const portalUnlockBlockerSchema = z.object({
  code: z.string().min(1).optional(),
  message: z.string().min(1),
  field: z.string().min(1).optional(),
})

export const portalUnlockReasonSchema = z.string().min(1)

export type PortalUnlockBlocker = z.infer<typeof portalUnlockBlockerSchema>
