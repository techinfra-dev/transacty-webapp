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

export const merchantSchema = z.object({
  name: z.string().min(1),
  status: z.string().min(1),
  kycStatus: z.string().min(1),
})

/** Session JWT + user payload — returned after login (no MFA) or after MFA verify. */
export const authSessionResponseSchema = z.object({
  token: z.string().min(1),
  merchantId: z.string().min(1),
  email: z.email(),
  role: z.string().min(1),
  needsActivation: z.boolean(),
  merchant: merchantSchema,
})

/** When MFA is enabled — no session token until TOTP step completes. */
export const loginMfaRequiredResponseSchema = z.object({
  requiresMfa: z.literal(true),
  mfaToken: z.string().min(1),
  merchantId: z.string().min(1),
  email: z.email(),
})

export const loginResponseSchema = z.union([
  loginMfaRequiredResponseSchema,
  authSessionResponseSchema,
])

export const mfaVerifyRequestSchema = z.object({
  mfaToken: z.string().min(1),
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit code')),
})

export const forgotPasswordRequestSchema = z.object({
  email: z.email(),
})

export const forgotPasswordResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
})

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
})

export const resetPasswordResponseSchema = z.object({
  ok: z.boolean(),
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
/** @deprecated Use AuthSessionResponse */
export type AuthResponse = z.infer<typeof authSessionResponseSchema>
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type LoginMfaRequiredResponse = z.infer<
  typeof loginMfaRequiredResponseSchema
>
export type MfaVerifyRequest = z.infer<typeof mfaVerifyRequestSchema>
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>
