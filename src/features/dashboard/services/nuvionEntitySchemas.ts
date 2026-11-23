import { z } from 'zod'
import { portalEnvironmentSchema } from './transactionsSchemas.ts'

export const nuvionAddressSchema = z.object({
  line1: z.string().trim().min(1, 'Address line is required.'),
  city: z.string().trim().min(1, 'City is required.'),
  state: z.string().trim().min(1, 'State / province is required.'),
  postalCode: z.string().trim().min(1, 'Postal code is required.'),
  countryCode: z
    .string()
    .trim()
    .length(2, 'Use a 2-letter country code (e.g. US).')
    .transform((value) => value.toUpperCase()),
})

export const createNuvionEntityPayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  address: nuvionAddressSchema,
  description: z
    .string()
    .trim()
    .min(1, 'Describe what the business does.')
    .max(1000, 'Description must be 1000 characters or fewer.'),
  incorporationCountry: z
    .string()
    .trim()
    .length(2, 'Use a 2-letter incorporation country code.')
    .transform((value) => value.toUpperCase()),
  incorporationState: z.string().trim().min(1, 'Incorporation state is required.'),
})

export const nuvionEntitySchema = z
  .object({
    nuvionEntityId: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    status: z.string().min(1),
    environment: portalEnvironmentSchema.optional(),
  })
  .passthrough()
  .transform((value) => ({
    ...value,
    nuvionEntityId: (value.nuvionEntityId ?? value.id ?? '').trim(),
  }))
  .refine((value) => value.nuvionEntityId.length > 0, {
    message: 'Nuvion entity id is missing.',
  })

export type NuvionAddress = z.infer<typeof nuvionAddressSchema>
export type CreateNuvionEntityPayload = z.infer<
  typeof createNuvionEntityPayloadSchema
>
export type NuvionEntity = z.infer<typeof nuvionEntitySchema>

export type NuvionEntityFormState = {
  line1: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  description: string
  incorporationCountry: string
  incorporationState: string
}

export const emptyNuvionEntityForm = (): NuvionEntityFormState => ({
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  countryCode: 'US',
  description: '',
  incorporationCountry: 'US',
  incorporationState: '',
})
