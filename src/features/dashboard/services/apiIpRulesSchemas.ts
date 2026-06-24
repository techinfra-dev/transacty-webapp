import { z } from 'zod'
import { portalEnvironmentSchema } from './transactionsSchemas.ts'

export const apiIpEnforceModeSchema = z.enum(['strict', 'log_only'])

export const apiIpRulesSchema = z.object({
  merchantId: z.string().uuid(),
  environment: portalEnvironmentSchema,
  enabled: z.boolean(),
  enforceMode: apiIpEnforceModeSchema,
  cidrs: z.array(z.string()),
  notes: z.string().nullable(),
  updatedBy: z.string().nullable(),
  updatedAt: z.string().nullable(),
  clientIp: z.string(),
})

export const updateApiIpRulesPayloadSchema = z
  .object({
    environment: portalEnvironmentSchema,
    enabled: z.boolean(),
    enforceMode: apiIpEnforceModeSchema,
    cidrs: z.array(z.string().min(1)),
    notes: z.string().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.enabled && value.cidrs.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add at least one IP or CIDR before enabling the allowlist.',
        path: ['cidrs'],
      })
    }
  })

export type ApiIpEnforceMode = z.infer<typeof apiIpEnforceModeSchema>
export type ApiIpRules = z.infer<typeof apiIpRulesSchema>
export type UpdateApiIpRulesPayload = z.infer<typeof updateApiIpRulesPayloadSchema>
