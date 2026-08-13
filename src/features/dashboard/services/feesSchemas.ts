import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'

export const feeScheduleItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    rail: z.string().optional(),
    market: z.string().optional(),
    feeType: z.string().optional(),
    percentBps: z.number().optional(),
    flatAmount: z.string().optional(),
    currency: z.string().optional(),
    status: z.string().optional(),
    effectiveFrom: z.string().nullable().optional(),
    effectiveTo: z.string().nullable().optional(),
  })
  .passthrough()

export const merchantFeesResponseSchema = z
  .object({
    environment: portalEnvironmentSchema.optional(),
    schedules: z.array(feeScheduleItemSchema).optional(),
    items: z.array(feeScheduleItemSchema).optional(),
    legacy: z
      .object({
        payinPercentBps: z.number().optional(),
        payoutPercentBps: z.number().optional(),
        payinFlat: z.string().optional(),
        payoutFlat: z.string().optional(),
      })
      .passthrough()
      .optional(),
    source: z.string().optional(),
  })
  .passthrough()

export type FeeScheduleItem = z.infer<typeof feeScheduleItemSchema>
export type MerchantFeesResponse = z.infer<typeof merchantFeesResponseSchema>
