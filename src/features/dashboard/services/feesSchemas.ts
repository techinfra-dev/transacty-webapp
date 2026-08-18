import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'

export const feeScheduleItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    source: z.string().optional(),
    environment: portalEnvironmentSchema.optional(),
    rail: z.string().optional(),
    market: z.string().optional(),
    currency: z.string().optional(),
    feeType: z.string().optional(),
    billingMode: z.string().optional(),
    feePercentage: z.string().optional(),
    feeFlat: z.string().optional(),
    feeMin: z.string().optional(),
    feeMax: z.string().nullable().optional(),
    percentBps: z.number().optional(),
    flatAmount: z.string().optional(),
    status: z.string().optional(),
    effectiveFrom: z.string().nullable().optional(),
    effectiveTo: z.string().nullable().optional(),
  })
  .passthrough()

export const merchantFeesResponseSchema = z
  .object({
    environment: portalEnvironmentSchema.optional(),
    items: z.array(feeScheduleItemSchema).optional(),
    schedules: z.array(feeScheduleItemSchema).optional(),
    note: z.string().optional(),
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
