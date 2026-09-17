import { z } from 'zod'

const COMMON_PASSWORDS = new Set([
  'password123',
  'password1234',
  'password12345',
  '1234567890',
  '0123456789',
  'qwerty1234',
  'qwerty12345',
  'abcdefg123',
  'letmein123',
  'welcome123',
  'admin12345',
  'changeme12',
  'iloveyou12',
])

export const creationPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters.')
  .max(128, 'Password must be no more than 128 characters.')
  .regex(/[A-Za-z]/, 'Password must include a letter.')
  .regex(/\d/, 'Password must include a number.')
  .refine(
    (value) => !COMMON_PASSWORDS.has(value.toLowerCase()),
    'Avoid common passwords.',
  )

export const signupRequestSchema = z.object({
  businessName: z.string().min(1).max(200),
  email: z.email(),
  password: creationPasswordSchema,
})

export function getSignupFormErrorMessage(
  input: { businessName: string; email: string; password: string },
  error: z.ZodError,
): string {
  if (!input.businessName.trim()) return 'Please enter your business name.'
  if (!input.email.trim()) return 'Please enter your email address.'
  if (!z.email().safeParse(input.email.trim()).success) {
    return 'Please enter a valid email address.'
  }
  if (!input.password) return 'Please enter a password.'
  return (
    error.issues.find((issue) => issue.path[0] === 'password')?.message ??
    'Please check your details and try again.'
  )
}

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
})

/** User-facing copy for login form / client validation (before or instead of API). */
export function getLoginFormErrorMessage(
  input: { email: string; password: string },
  error: z.ZodError,
): string {
  const email = input.email.trim()
  const password = input.password
  if (!email && !password) {
    return 'Please enter your email and password.'
  }
  if (!email) {
    return 'Please enter your email address.'
  }
  if (!password) {
    return 'Please enter your password.'
  }
  const first = error.issues[0]
  if (first?.path[0] === 'email') {
    return 'Please enter a valid email address.'
  }
  if (first?.path[0] === 'password') {
    return 'Password must be at least 8 characters.'
  }
  return (
    first?.message ?? 'Please check your email and password and try again.'
  )
}

export const merchantSchema = z
  .object({
    id: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    businessName: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    status: z.string().min(1),
    kycStatus: z.string().min(1),
  })
  .transform((merchant) => {
    const displayName = merchant.businessName ?? merchant.name ?? 'Merchant'
    return {
      ...merchant,
      name: displayName,
      businessName: displayName,
    }
  })

export const portalRoleSchema = z.enum(['admin', 'finance', 'viewer'])

export type PortalStepUpAction =
  | 'money.write'
  | 'payout_pin.write'
  | 'payout_approval.review'
  | 'api_keys.write'
  | 'webhook.write'
  | 'audit.export'
  | 'any'

export const portalStepUpActionSchema = z.enum([
  'money.write',
  'payout_pin.write',
  'payout_approval.review',
  'api_keys.write',
  'webhook.write',
  'audit.export',
  'any',
])

/** Session JWT + user payload — returned after login (no MFA) or after MFA verify. */
export const authSessionResponseSchema = z.object({
  token: z.string().min(1),
  merchantId: z.string().min(1),
  merchantSlug: z.string().min(1).optional(),
  email: z.email(),
  role: z.string().min(1),
  needsActivation: z.boolean(),
  mfaEnabled: z.boolean().optional().default(false),
  mfaSetupRequired: z.boolean().optional().default(false),
  payoutPinConfigured: z.boolean().optional().default(false),
  payoutPinSetupRequired: z.boolean().optional().default(false),
  merchant: merchantSchema,
})

/** When MFA is enabled — no session token until TOTP step completes. */
export const loginMfaRequiredResponseSchema = z.object({
  requiresMfa: z.literal(true),
  mfaToken: z.string().min(1),
  merchantId: z.string().min(1),
  merchantSlug: z.string().min(1).optional(),
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

export const stepUpRequestSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit code')),
  action: portalStepUpActionSchema,
})

export const stepUpResponseSchema = z.object({
  token: z.string().min(1),
  tokenType: z.string().min(1).optional(),
  expiresIn: z.union([z.string(), z.number()]).optional(),
  action: portalStepUpActionSchema.or(z.string().min(1)),
})

export const revokeSessionsRequestSchema = z.object({
  password: z.string().min(1, 'Please enter your password.'),
})

export const revokeSessionsResponseSchema = z.object({
  ok: z.boolean(),
  sessionVersion: z.number().optional(),
})

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().pipe(z.email()),
})

export function getForgotPasswordFormErrorMessage(email: string): string {
  return email.trim()
    ? 'Please enter a valid email address.'
    : 'Please enter your email address.'
}

export const forgotPasswordResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
})

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: creationPasswordSchema,
})

export const resetPasswordResponseSchema = z.object({
  ok: z.boolean(),
})

/** Payout PIN reset email — unauthenticated, generic response (no enumeration). */
export const forgotPayoutPinRequestSchema = z.object({
  email: z.string().trim().pipe(z.email()),
})

export const forgotPayoutPinResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().optional(),
})

export const logoutResponseSchema = z.object({
  ok: z.boolean(),
})

export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  stepUpRequired: z.boolean().optional(),
  mfaSetupRequired: z.boolean().optional(),
  payoutPinRequired: z.boolean().optional(),
  payoutPinConfigured: z.boolean().optional(),
  payoutPinInvalid: z.boolean().optional(),
  payoutPinLocked: z.boolean().optional(),
  payoutPinSetupRequired: z.boolean().optional(),
  payoutPinAdminRequired: z.boolean().optional(),
  lockedUntil: z.string().optional(),
  action: z.string().optional(),
  reason: z.string().optional(),
  code: z.string().optional(),
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
export type StepUpRequest = z.infer<typeof stepUpRequestSchema>
export type StepUpResponse = z.infer<typeof stepUpResponseSchema>
export type RevokeSessionsRequest = z.infer<typeof revokeSessionsRequestSchema>
export type RevokeSessionsResponse = z.infer<typeof revokeSessionsResponseSchema>
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>
export type ForgotPayoutPinRequest = z.infer<typeof forgotPayoutPinRequestSchema>
export type ApiErrorBody = z.infer<typeof apiErrorSchema>
