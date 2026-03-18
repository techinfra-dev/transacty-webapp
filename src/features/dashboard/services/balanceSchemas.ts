import { z } from 'zod'

export const balanceResponseSchema = z.object({
  balance: z.string(),
  availableBalance: z.string(),
  pendingBalance: z.string(),
  currency: z.string().min(1),
  lastUpdated: z.string().min(1),
  limits: z.object({
    payin: z.object({
      min: z.number(),
      max: z.number(),
    }),
    payout: z.object({
      min: z.number(),
      max: z.number(),
    }),
  }),
})

export type BalanceResponse = z.infer<typeof balanceResponseSchema>
