import type { CreateBrPayoutPayload } from './brPayoutSchemas.ts'

export type BrPayoutFormPayload = Omit<CreateBrPayoutPayload, 'environment'>
