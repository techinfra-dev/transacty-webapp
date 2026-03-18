import { AxiosError } from 'axios'
import { supabaseClient } from '../../../api/supabaseClient.ts'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  kycBusinessPayloadSchema,
  kycBusinessResponseSchema,
  kycCreatedItemResponseSchema,
  kycDocumentPayloadSchema,
  kycDocumentUploadUrlPayloadSchema,
  kycDocumentUploadUrlResponseSchema,
  kycDocumentsListResponseSchema,
  kycPersonPayloadSchema,
  kycPersonsListResponseSchema,
  kycSubmitResponseSchema,
  type KycBusinessPayload,
  type KycDocumentPayload,
  type KycDocumentUploadUrlPayload,
  type KycDocumentUploadUrlResponse,
  type KycPersonPayload,
} from './kycSchemas.ts'

function getKycApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as { error?: unknown; message?: unknown }
    if (typeof data.message === 'string' && data.message.length > 0) {
      return data.message
    }
    if (typeof data.error === 'string' && data.error.length > 0) {
      return data.error
    }
  }
  return 'Something went wrong. Please try again.'
}

function getAuthHeader() {
  const token = getAuthToken()
  if (!token) {
    throw new Error('You are not authenticated')
  }
  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function upsertKycBusiness(payload: KycBusinessPayload) {
  try {
    const validatedPayload = kycBusinessPayloadSchema.parse(payload)
    const response = await axiosInstance.put('me/kyc/business', validatedPayload, {
      headers: getAuthHeader(),
    })
    return kycBusinessResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}

export async function addKycPerson(payload: KycPersonPayload) {
  try {
    const validatedPayload = kycPersonPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/kyc/persons', validatedPayload, {
      headers: getAuthHeader(),
    })
    return kycCreatedItemResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}

export async function listKycPersons() {
  try {
    const response = await axiosInstance.get('me/kyc/persons', {
      headers: getAuthHeader(),
    })
    return kycPersonsListResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}

export async function addKycDocument(payload: KycDocumentPayload) {
  try {
    const validatedPayload = kycDocumentPayloadSchema.parse(payload)
    const response = await axiosInstance.post(
      'me/kyc/documents',
      validatedPayload,
      {
        headers: getAuthHeader(),
      },
    )
    return kycCreatedItemResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}

export async function createKycDocumentUploadUrl(
  payload: KycDocumentUploadUrlPayload,
): Promise<KycDocumentUploadUrlResponse> {
  try {
    const validatedPayload = kycDocumentUploadUrlPayloadSchema.parse(payload)
    const response = await axiosInstance.post(
      'me/kyc/documents/upload-url',
      validatedPayload,
      {
        headers: getAuthHeader(),
      },
    )
    return kycDocumentUploadUrlResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}

export async function uploadDocumentToSignedUrl(params: {
  bucket: string
  path: string
  uploadToken: string
  file: File
}) {
  const { bucket, path, uploadToken, file } = params
  const result = await supabaseClient.storage
    .from(bucket)
    .uploadToSignedUrl(path, uploadToken, file)

  if (result.error) {
    throw new Error(result.error.message || 'Unable to upload file right now.')
  }
}

export async function listKycDocuments() {
  try {
    const response = await axiosInstance.get('me/kyc/documents', {
      headers: getAuthHeader(),
    })
    return kycDocumentsListResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}

export async function submitKyc() {
  try {
    const response = await axiosInstance.post(
      'me/kyc/submit',
      undefined,
      {
        headers: getAuthHeader(),
      },
    )
    return kycSubmitResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getKycApiErrorMessage(error))
  }
}
