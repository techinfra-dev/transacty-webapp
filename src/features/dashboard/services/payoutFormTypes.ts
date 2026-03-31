import type { CreatePayoutPayload } from './payoutsSchemas.ts'

export type PayoutFormPayload = Omit<CreatePayoutPayload, 'environment'>
