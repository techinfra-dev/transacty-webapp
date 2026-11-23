import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getPortalAuthHeaders } from '../../../api/portalAuthHeaders.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  createNuvionEntityPayloadSchema,
  nuvionEntitySchema,
  type CreateNuvionEntityPayload,
  type NuvionEntity,
} from './nuvionEntitySchemas.ts'

export class NuvionEntityNotFoundError extends Error {
  constructor(message = 'No Nuvion entity found for this environment.') {
    super(message)
    this.name = 'NuvionEntityNotFoundError'
  }
}

function getNuvionEntityApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
      merchantFacingError?: { message?: unknown }
    }
    const merchantMessage = responseData.merchantFacingError?.message
    if (typeof merchantMessage === 'string' && merchantMessage.trim()) {
      return merchantMessage.trim()
    }
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message.trim()
    }
    if (typeof responseData.error === 'string' && responseData.error.trim()) {
      return responseData.error.trim()
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Unable to complete the Nuvion entity request right now.'
}

export async function getNuvionEntity(
  environment: PortalEnvironment,
): Promise<NuvionEntity | null> {
  try {
    const response = await axiosInstance.get('me/nuvion/entity', {
      headers: getPortalAuthHeaders(),
      params: { environment },
    })
    return nuvionEntitySchema.parse(response.data)
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null
    }
    throw new Error(getNuvionEntityApiErrorMessage(error))
  }
}

export async function createNuvionEntity(
  payload: CreateNuvionEntityPayload,
): Promise<NuvionEntity> {
  try {
    const body = createNuvionEntityPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/nuvion/entity', body, {
      headers: getPortalAuthHeaders(),
    })
    return nuvionEntitySchema.parse(response.data)
  } catch (error) {
    throw new Error(getNuvionEntityApiErrorMessage(error))
  }
}
