import { z } from 'zod'

export const signupRequestSchema = z.object({
  businessName: z.string().min(1).max(200),
  email: z.email(),
  password: z.string().min(8).max(128),
})

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
})

export const authResponseSchema = z.object({
  token: z.string().min(1),
  merchantId: z.string().min(1),
  email: z.email(),
  role: z.string().min(1),
  needsActivation: z.boolean(),
  merchant: z.object({
    name: z.string().min(1),
    status: z.string().min(1),
    kycStatus: z.string().min(1),
  }),
})

export const logoutResponseSchema = z.object({
  ok: z.boolean(),
})

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
})

export type SignupRequest = z.infer<typeof signupRequestSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
