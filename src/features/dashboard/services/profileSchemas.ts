import { z } from 'zod'

const businessProfileSchema = z.object({
  id: z.string().min(1),
  legalName: z.string().min(1),
  tradingName: z.string().nullable().optional(),
  businessType: z.string().min(1),
  status: z.string().min(1),
})

export const profileResponseSchema = z.object({
  merchantId: z.string().min(1),
  businessName: z.string().min(1),
  email: z.email(),
  role: z.string().min(1),
  kycStatus: z.enum(['pending', 'verified', 'rejected']),
  needsActivation: z.boolean(),
  canCreateApiKeys: z.boolean(),
  businessProfile: businessProfileSchema.nullable(),
  personsCount: z.number(),
  documentsCount: z.number(),
})

export const updateProfileRequestSchema = z.object({
  businessName: z.string().min(1).max(200),
})

export const updateProfileResponseSchema = z.object({
  ok: z.boolean(),
})

export type ProfileResponse = z.infer<typeof profileResponseSchema>
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
