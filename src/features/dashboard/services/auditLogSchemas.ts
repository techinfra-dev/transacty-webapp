import { z } from 'zod'

export const auditLogItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    action: z.string().min(1),
    actorEmail: z.string().optional(),
    actorId: z.string().optional(),
    createdAt: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
    ip: z.string().nullable().optional(),
  })
  .passthrough()

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogItemSchema),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type AuditLogItem = z.infer<typeof auditLogItemSchema>
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>
