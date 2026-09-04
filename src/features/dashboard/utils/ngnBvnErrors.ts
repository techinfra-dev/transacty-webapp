import { AxiosError } from 'axios'
import { apiErrorSchema } from '../../auth/services/authSchemas.ts'

export const NGN_BVN_REQUIRED_CODE = 'ngn_bvn_required'

export const NGN_BVN_REQUIRED_COPY =
  'Complete BVN verification before NGN payouts. Submit your BVN under Nigeria virtual account settings.'

export class NgnBvnRequiredError extends Error {
  readonly code = NGN_BVN_REQUIRED_CODE

  constructor(message = NGN_BVN_REQUIRED_COPY) {
    super(message)
    this.name = 'NgnBvnRequiredError'
  }
}

export function parseNgnBvnRequiredError(error: unknown) {
  if (error instanceof NgnBvnRequiredError) {
    return error
  }
  if (!(error instanceof AxiosError) || !error.response) {
    return null
  }
  const parsed = apiErrorSchema.safeParse(error.response.data)
  const code =
    parsed.success
      ? parsed.data.code
      : typeof error.response.data === 'object' &&
          error.response.data &&
          'code' in error.response.data
        ? String((error.response.data as { code?: unknown }).code ?? '')
        : ''
  if (code !== NGN_BVN_REQUIRED_CODE) {
    return null
  }
  const message =
    (parsed.success ? parsed.data.message : undefined)?.trim() ||
    NGN_BVN_REQUIRED_COPY
  return new NgnBvnRequiredError(message)
}

export function assertNotNgnBvnRequired(error: unknown): void {
  const parsed = parseNgnBvnRequiredError(error)
  if (parsed) {
    throw parsed
  }
}
