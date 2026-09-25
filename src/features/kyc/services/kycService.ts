import { AxiosError } from 'axios'
import { supabaseClient } from '../../../api/supabaseClient.ts'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  kycBusinessDetailSchema,
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
  type KycBusinessDetail,
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

/** Loads saved business KYC fields. Returns null when unavailable. */
export async function getKycBusiness(): Promise<KycBusinessDetail | null> {
  try {
    const response = await axiosInstance.get('me/kyc/business', {
      headers: getAuthHeader(),
    })
    return kycBusinessDetailSchema.parse(response.data)
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status
      if (status === 404 || status === 405 || status === 501) {
        return null
      }
    }
    // Prefer profile/draft hydration over failing the wizard open path.
    return null
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

function isSignedStorageUrl(url: string) {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      (parsed.pathname.includes('/storage/v1/') ||
        parsed.searchParams.has('token'))
    )
  } catch {
    return false
  }
}

async function putFileToSignedUrl(
  url: string,
  file: File,
  contentType?: string,
) {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type':
          contentType?.trim() || file.type || 'application/octet-stream',
        'x-upsert': 'false',
      },
      body: file,
    })
  } catch {
    throw new Error(
      'Unable to reach file storage. Confirm this site can connect to Supabase.',
    )
  }

  if (!response.ok) {
    throw new Error('Unable to upload file right now.')
  }
}

export async function uploadDocumentToSignedUrl(params: {
  uploadUrl: string
  bucket?: string
  path?: string
  uploadToken?: string
  file: File
  contentType?: string
}) {
  const { uploadUrl, bucket, path, uploadToken, file, contentType } = params

  if (isSignedStorageUrl(uploadUrl)) {
    await putFileToSignedUrl(uploadUrl, file, contentType)
    return
  }

  if (bucket && path && uploadToken) {
    const result = await supabaseClient.storage
      .from(bucket)
      .uploadToSignedUrl(path, uploadToken, file)

    if (result.error) {
      throw new Error(result.error.message || 'Unable to upload file right now.')
    }
    return
  }

  throw new Error('Upload URL from the server is incomplete.')
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
