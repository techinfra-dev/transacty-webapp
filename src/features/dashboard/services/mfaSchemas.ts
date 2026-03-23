import { z } from 'zod'

export const mfaStatusResponseSchema = z.object({
  enabled: z.boolean(),
  pendingSetup: z.boolean(),
})

export const mfaSetupResponseSchema = z.object({
  otpauthUrl: z.string().min(1),
  issuer: z.string().min(1),
  accountEmail: z.string().email(),
})

export const mfaConfirmRequestSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Please enter a valid 6-digit code.'),
})

export const mfaDisableRequestSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Please enter a valid 6-digit code.'),
})

export const okResponseSchema = z.object({
  ok: z.boolean(),
})

export type MfaStatusResponse = z.infer<typeof mfaStatusResponseSchema>
export type MfaSetupResponse = z.infer<typeof mfaSetupResponseSchema>
export type MfaConfirmRequest = z.infer<typeof mfaConfirmRequestSchema>
export type MfaDisableRequest = z.infer<typeof mfaDisableRequestSchema>
