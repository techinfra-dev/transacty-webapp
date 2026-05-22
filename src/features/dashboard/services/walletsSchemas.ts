import { z } from 'zod'

export const portalEnvironmentResponseSchema = z.enum(['test', 'live'])

export const merchantWalletItemSchema = z.object({
  id: z.string().min(1),
  currency: z.string().min(1),
  balance: z.string(),
  status: z.string().min(1),
  label: z.string().nullish(),
  updatedAt: z.string(),
  createdAt: z.string(),
})

export const merchantWalletsResponseSchema = z.object({
  environment: portalEnvironmentResponseSchema,
  items: z.array(merchantWalletItemSchema),
})

export type MerchantWalletItem = z.infer<typeof merchantWalletItemSchema>
export type MerchantWalletsResponse = z.infer<typeof merchantWalletsResponseSchema>
