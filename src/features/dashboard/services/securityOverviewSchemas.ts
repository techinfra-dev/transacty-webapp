import { z } from 'zod'

export const securityOverviewResponseSchema = z
  .object({
    mfaEnabled: z.boolean().optional(),
    mfaSetupRequired: z.boolean().optional(),
    sessionVersionNote: z.string().nullable().optional(),
    apiKeyCount: z.number().optional(),
    apiKeyLiveCount: z.number().optional(),
    apiKeyTestCount: z.number().optional(),
    webhookConfigured: z.boolean().optional(),
    webhookUrl: z.string().nullable().optional(),
    ipAllowlistCount: z.number().optional(),
    ipAllowlistEnabled: z.boolean().optional(),
    recentSecurityAudit: z
      .array(
        z
          .object({
            action: z.string().min(1),
            createdAt: z.string().min(1),
            actorEmail: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough()

export type SecurityOverviewResponse = z.infer<
  typeof securityOverviewResponseSchema
>
