import { z } from 'zod'

export const customerStatusSchema = z.enum([
  'active',
  'frozen',
  'pending',
  'closed',
])

export const customerItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().nullable().optional(),
  balance: z.string(),
  currency: z.string().min(1),
  status: customerStatusSchema,
  createdAt: z.string().min(1),
})

export const customersListResponseSchema = z.object({
  items: z.array(customerItemSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export const createCustomerPayloadSchema = z.object({
  label: z.string().min(1).optional(),
})

export const updateCustomerStatusPayloadSchema = z.object({
  status: customerStatusSchema,
  reason: z.string().min(1).optional(),
})

export const updateCustomerStatusResponseSchema = z.object({
  id: z.string().min(1),
  status: customerStatusSchema,
})

export const customerTransactionItemSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    amount: z.string().optional(),
    status: z.string().optional(),
    createdAt: z.string().optional(),
    reference: z.string().optional(),
  })
  .passthrough()

export const customerTransactionsListResponseSchema = z.object({
  items: z.array(customerTransactionItemSchema),
  total: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
})

export type CustomerStatus = z.infer<typeof customerStatusSchema>
export type CustomerItem = z.infer<typeof customerItemSchema>
export type CustomersListResponse = z.infer<typeof customersListResponseSchema>
export type CreateCustomerPayload = z.infer<typeof createCustomerPayloadSchema>
export type UpdateCustomerStatusPayload = z.infer<
  typeof updateCustomerStatusPayloadSchema
>
export type CustomerTransactionsListResponse = z.infer<
  typeof customerTransactionsListResponseSchema
>
