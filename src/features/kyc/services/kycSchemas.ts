import { z } from 'zod'
import {
  isValidDateOfBirth,
  kycPersonFullNameSchema,
  kycPersonNationalitySchema,
} from './kycPersonValidation.ts'

export const kycBusinessPayloadSchema = z.object({
  legalName: z.string().min(1),
  tradingName: z.string().optional(),
  businessType: z.string().min(1),
  registrationNumber: z.string().optional(),
  incorporationDate: z.string().optional(),
  industry: z.string().optional(),
  registeredAddress: z.string().min(1),
  operatingAddress: z.string().optional(),
  taxId: z.string().optional(),
  contactPhone: z.string().min(1),
  contactEmail: z.email(),
})

export const kycBusinessResponseSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
})

/** Full business profile returned by GET me/kyc/business (and similar). */
export const kycBusinessDetailSchema = z
  .object({
    id: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    legalName: z.string().optional(),
    tradingName: z.string().nullable().optional(),
    businessType: z.string().optional(),
    registrationNumber: z.string().nullable().optional(),
    incorporationDate: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    registeredAddress: z.string().nullable().optional(),
    operatingAddress: z.string().nullable().optional(),
    taxId: z.string().nullable().optional(),
    contactPhone: z.string().nullable().optional(),
    contactEmail: z.string().nullable().optional(),
  })
  .passthrough()

export const kycPersonPayloadSchema = z.object({
  role: z.enum(['director', 'ubo', 'authorized_signatory']),
  fullName: kycPersonFullNameSchema,
  nationality: kycPersonNationalitySchema,
  dateOfBirth: z
    .string()
    .min(1, 'Please enter a date of birth.')
    .refine((value) => {
      // Accept YYYY-MM-DD form values and ISO payloads from the UI.
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return isValidDateOfBirth(value)
      }
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return false
      }
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return date.getTime() <= today.getTime()
    }, 'Date of birth cannot be in the future.'),
  idType: z.enum(['nid', 'passport']),
  idNumber: z.string().min(1),
  address: z.string().min(1),
  ownershipPercentage: z.number().min(0).max(100).optional(),
})

export const kycCreatedItemResponseSchema = z.object({
  id: z.string().min(1),
})

export const kycPersonListItemSchema = z
  .object({
    id: z.string().min(1),
    role: z.string().min(1),
    fullName: z.string().min(1),
    status: z.string().min(1),
    nationality: z.string().optional(),
    dateOfBirth: z.string().optional(),
    idType: z.string().optional(),
    idNumber: z.string().optional(),
    address: z.string().optional(),
    ownershipPercentage: z.number().optional(),
  })
  .passthrough()

export const kycPersonsListResponseSchema = z.object({
  items: z.array(kycPersonListItemSchema),
})

export const kycDocumentPayloadSchema = z.object({
  documentType: z.string().min(1),
  fileReference: z.string().min(1),
  documentNumber: z.string().optional(),
  merchantPersonId: z.string().optional(),
})

export const kycDocumentUploadUrlPayloadSchema = z.object({
  documentType: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1).optional(),
  merchantPersonId: z.string().optional(),
})

export const kycDocumentUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().min(1),
  uploadToken: z.string().min(1),
  path: z.string().min(1),
  bucket: z.string().min(1),
  fileReference: z.string().min(1),
  expiresIn: z.number(),
})

export const kycDocumentListItemSchema = z
  .object({
    id: z.string().min(1),
    documentType: z.string().min(1),
    status: z.string().min(1),
    submittedAt: z.string().optional(),
    documentNumber: z.string().nullable().optional(),
    merchantPersonId: z.string().nullable().optional(),
    fileReference: z.string().optional(),
  })
  .passthrough()

export const kycDocumentsListResponseSchema = z.object({
  items: z.array(kycDocumentListItemSchema),
})

export const kycSubmitResponseSchema = z.object({
  status: z.string().min(1),
})

export type KycBusinessPayload = z.infer<typeof kycBusinessPayloadSchema>
export type KycBusinessResponse = z.infer<typeof kycBusinessResponseSchema>
export type KycBusinessDetail = z.infer<typeof kycBusinessDetailSchema>
export type KycPersonPayload = z.infer<typeof kycPersonPayloadSchema>
export type KycPersonListItem = z.infer<typeof kycPersonListItemSchema>
export type KycDocumentPayload = z.infer<typeof kycDocumentPayloadSchema>
export type KycDocumentUploadUrlPayload = z.infer<
  typeof kycDocumentUploadUrlPayloadSchema
>
export type KycDocumentUploadUrlResponse = z.infer<
  typeof kycDocumentUploadUrlResponseSchema
>
export type KycDocumentListItem = z.infer<typeof kycDocumentListItemSchema>
