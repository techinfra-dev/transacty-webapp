import { z } from 'zod'

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

export const kycPersonPayloadSchema = z.object({
  role: z.enum(['director', 'ubo', 'authorized_signatory']),
  fullName: z.string().min(1),
  nationality: z.string().min(1),
  dateOfBirth: z.string().optional(),
  idType: z.enum(['nid', 'passport']),
  idNumber: z.string().min(1),
  address: z.string().min(1),
  ownershipPercentage: z.number().min(0).max(100).optional(),
})

export const kycCreatedItemResponseSchema = z.object({
  id: z.string().min(1),
})

export const kycPersonListItemSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  fullName: z.string().min(1),
  status: z.string().min(1),
})

export const kycPersonsListResponseSchema = z.object({
  items: z.array(kycPersonListItemSchema),
})

export const kycDocumentPayloadSchema = z.object({
  documentType: z.string().min(1),
  fileReference: z.string().min(1),
  documentNumber: z.string().optional(),
  merchantPersonId: z.string().optional(),
})

export const kycDocumentListItemSchema = z.object({
  id: z.string().min(1),
  documentType: z.string().min(1),
  status: z.string().min(1),
  submittedAt: z.string().optional(),
})

export const kycDocumentsListResponseSchema = z.object({
  items: z.array(kycDocumentListItemSchema),
})

export const kycSubmitResponseSchema = z.object({
  status: z.string().min(1),
})

export type KycBusinessPayload = z.infer<typeof kycBusinessPayloadSchema>
export type KycBusinessResponse = z.infer<typeof kycBusinessResponseSchema>
export type KycPersonPayload = z.infer<typeof kycPersonPayloadSchema>
export type KycPersonListItem = z.infer<typeof kycPersonListItemSchema>
export type KycDocumentPayload = z.infer<typeof kycDocumentPayloadSchema>
export type KycDocumentListItem = z.infer<typeof kycDocumentListItemSchema>
