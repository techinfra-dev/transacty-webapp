import { z } from 'zod'
import { portalEnvironmentSchema } from './customersSchemas.ts'

const amountPattern = /^\d+(\.\d{1,2})?$/

export const brPixPayinCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required.'),
  email: z.string().email('Enter a valid customer email.'),
  phone: z.string().min(1, 'Customer phone is required.'),
  deviceId: z.string().min(1, 'Device ID is required.'),
})

export const brPixPayinGoodsInfoSchema = z.object({
  name: z.string().min(1, 'Goods name is required.'),
  id: z.string().optional(),
  price: z.string().optional(),
})

export const createBrPixPayinPayloadSchema = z.object({
  environment: portalEnvironmentSchema,
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .regex(amountPattern, 'Amount must be a valid number with up to 2 decimals.'),
  paymentMethodCode: z.enum(['PIX']).default('PIX'),
  returnUrl: z.string().url('Enter a valid return URL.'),
  customer: brPixPayinCustomerSchema,
  goodsInfo: brPixPayinGoodsInfoSchema,
})

export const brPixPaymentInfoSchema = z
  .object({
    content: z.string().optional(),
    type: z.enum(['url', 'code', 'html', 'json']).or(z.string()).optional(),
  })
  .passthrough()

export const brPixPayinResponseSchema = z
  .object({
    transactionId: z.string().min(1).optional(),
    id: z.string().optional(),
    status: z.string().optional(),
    amount: z.string().optional(),
    currency: z.string().optional(),
    platformOrderId: z.string().nullable().optional(),
    paymentInfo: brPixPaymentInfoSchema.nullable().optional(),
    expiresAt: z.string().nullable().optional(),
    fees: z
      .object({
        platformFee: z.string().optional(),
        feeType: z.string().optional(),
        feeStatus: z.string().optional(),
      })
      .passthrough()
      .optional(),
    netAmount: z.string().nullable().optional(),
  })
  .passthrough()

export type CreateBrPixPayinPayload = z.infer<typeof createBrPixPayinPayloadSchema>
export type BrPixPayinResponse = z.infer<typeof brPixPayinResponseSchema>
export type BrPixPaymentInfo = z.infer<typeof brPixPaymentInfoSchema>
