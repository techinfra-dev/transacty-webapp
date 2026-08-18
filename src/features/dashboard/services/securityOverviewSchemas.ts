import { z } from 'zod'

const ipAllowlistEnvSchema = z
  .object({
    enabled: z.boolean(),
    cidrCount: z.number(),
  })
  .passthrough()

const securityActionSchema = z
  .object({
    id: z.string().optional(),
    action: z.string().min(1),
    createdAt: z.string().min(1),
    actorEmail: z.string().nullable().optional(),
    resource: z.string().nullable().optional(),
  })
  .passthrough()

const securityOverviewApiSchema = z
  .object({
    mfa: z
      .object({
        enabled: z.boolean(),
        pendingSetup: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    sessions: z
      .object({
        sessionVersion: z.number().optional(),
        note: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
    apiKeys: z
      .object({
        active: z.number(),
        revoked: z.number().optional(),
        total: z.number().optional(),
        byEnvironment: z
          .object({
            test: z.number().optional(),
            live: z.number().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
    webhook: z
      .object({
        configured: z.boolean(),
      })
      .passthrough()
      .optional(),
    ipAllowlist: z
      .object({
        test: ipAllowlistEnvSchema.optional(),
        live: ipAllowlistEnvSchema.optional(),
      })
      .passthrough()
      .optional(),
    recentSecurityActions: z.array(securityActionSchema).optional(),
  })
  .passthrough()

export const securityOverviewResponseSchema = securityOverviewApiSchema.transform(
  (data) => {
    const testCidr = data.ipAllowlist?.test?.cidrCount ?? 0
    const liveCidr = data.ipAllowlist?.live?.cidrCount ?? 0
    const ipEnabled =
      Boolean(data.ipAllowlist?.test?.enabled) ||
      Boolean(data.ipAllowlist?.live?.enabled)

    return {
      mfaEnabled: data.mfa?.enabled ?? false,
      mfaSetupRequired: data.mfa?.pendingSetup ?? false,
      apiKeyCount: data.apiKeys?.active,
      webhookConfigured: data.webhook?.configured ?? false,
      ipAllowlistCount: testCidr + liveCidr,
      ipAllowlistEnabled: ipEnabled,
      ipAllowlistTestCount: data.ipAllowlist?.test?.cidrCount,
      ipAllowlistLiveCount: data.ipAllowlist?.live?.cidrCount,
      recentSecurityAudit: (data.recentSecurityActions ?? []).map((row) => ({
        id: row.id,
        action: row.action,
        createdAt: row.createdAt,
        actorEmail: row.actorEmail ?? undefined,
        resource: row.resource ?? undefined,
      })),
    }
  },
)

export type SecurityOverviewResponse = z.infer<
  typeof securityOverviewResponseSchema
>
