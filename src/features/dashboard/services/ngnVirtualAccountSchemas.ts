import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'

/**
 * BVN Basic provisioning for the permanent Nigeria virtual account.
 * `faceImage` belongs to the Advanced path and is never sent from the portal.
 */
export const provisionNgnVirtualAccountPayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  bvn: z
    .string()
    .trim()
    .regex(/^\d{11}$/, 'BVN must be exactly 11 digits.'),
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  phoneNumber: z.string().trim().min(1).optional(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must use YYYY-MM-DD format.')
    .optional(),
  customerEmail: z.string().trim().email('Enter a valid email address.').optional(),
})

export const ngnVirtualAccountStatusSchema = z
  .enum(['bvn_required', 'pending', 'active'])
  .or(z.string())

export const ngnVirtualAccountSchema = z
  .object({
    status: ngnVirtualAccountStatusSchema.optional(),
    bvnStatus: z.string().nullable().optional(),
    accountNumber: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    accountName: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    ready: z.boolean().optional(),
    environment: portalEnvironmentSchema.optional(),
  })
  .passthrough()

export type ProvisionNgnVirtualAccountPayload = z.infer<
  typeof provisionNgnVirtualAccountPayloadSchema
>
export type NgnVirtualAccount = z.infer<typeof ngnVirtualAccountSchema>

/** Form state for the BVN step — held in component state only, never stored. */
export type NgnBvnFormPayload = Omit<
  ProvisionNgnVirtualAccountPayload,
  'environment'
>

export function getNgnVirtualAccountStatus(account: NgnVirtualAccount) {
  return account.status?.trim().toLowerCase() || 'bvn_required'
}

export function isNgnVirtualAccountReady(account: NgnVirtualAccount) {
  return (
    account.ready === true ||
    (getNgnVirtualAccountStatus(account) === 'active' &&
      Boolean(account.accountNumber?.trim()))
  )
}

export function isNgnBvnRequired(account: NgnVirtualAccount | undefined) {
  if (!account) {
    return true
  }
  return (
    getNgnVirtualAccountStatus(account) === 'bvn_required' ||
    account.bvnStatus?.trim().toLowerCase() === 'failed'
  )
}
