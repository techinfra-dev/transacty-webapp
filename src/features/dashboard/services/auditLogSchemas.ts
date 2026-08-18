import { z } from 'zod'

export const auditLogMetaSchema = z
  .object({
    scopes: z.string().optional(),
    environment: z.string().optional(),
    revokedIds: z.array(z.string().min(1)).optional(),
  })
  .passthrough()

export const auditLogItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    action: z.string().min(1),
    resource: z.string().nullable().optional(),
    meta: auditLogMetaSchema.nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    actorEmail: z.string().nullable().optional(),
    merchantUserId: z.string().optional(),
    createdAt: z.string().min(1),
    ip: z.string().nullable().optional(),
  })
  .passthrough()

export const auditLogListResponseSchema = z.object({
  items: z.array(auditLogItemSchema),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type AuditLogMeta = z.infer<typeof auditLogMetaSchema>
export type AuditLogItem = z.infer<typeof auditLogItemSchema>
export type AuditLogListResponse = z.infer<typeof auditLogListResponseSchema>

export function getAuditLogMeta(item: AuditLogItem): AuditLogMeta {
  if (item.meta && typeof item.meta === 'object') {
    return item.meta
  }
  if (item.metadata && typeof item.metadata === 'object') {
    return item.metadata as AuditLogMeta
  }
  return {}
}
