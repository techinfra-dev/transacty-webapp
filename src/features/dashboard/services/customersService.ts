import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import type { PortalEnvironment } from '../../../types/portalEnvironment.ts'
import {
  createCustomerPayloadSchema,
  customerItemSchema,
  customerTransactionsListResponseSchema,
  customersListResponseSchema,
  updateCustomerStatusPayloadSchema,
  updateCustomerStatusResponseSchema,
  type CreateCustomerPayload,
  type CustomerStatus,
  type UpdateCustomerStatusPayload,
} from './customersSchemas.ts'

function getCustomersApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const responseData = error.response.data as {
      message?: unknown
      error?: unknown
    }
    if (
      typeof responseData.message === 'string' &&
      responseData.message.trim().length > 0
    ) {
      return responseData.message
    }
    if (
      typeof responseData.error === 'string' &&
      responseData.error.trim().length > 0
    ) {
      return responseData.error
    }
  }
  return 'Unable to complete this customer operation right now.'
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

export async function listCustomers(params: {
  environment: PortalEnvironment
  limit: number
  offset: number
  status?: CustomerStatus
}) {
  try {
    const response = await axiosInstance.get('me/customers', {
      headers: getAuthHeader(),
      params,
    })
    return customersListResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCustomersApiErrorMessage(error))
  }
}

export async function createCustomer(payload: CreateCustomerPayload) {
  try {
    const validatedPayload = createCustomerPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/customers', validatedPayload, {
      headers: getAuthHeader(),
    })
    return customerItemSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCustomersApiErrorMessage(error))
  }
}

export async function getCustomer(
  customerId: string,
  environment: PortalEnvironment,
) {
  try {
    const response = await axiosInstance.get(`me/customers/${customerId}`, {
      headers: getAuthHeader(),
      params: { environment },
    })
    return customerItemSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCustomersApiErrorMessage(error))
  }
}

export async function updateCustomerStatus(params: {
  customerId: string
  environment: PortalEnvironment
  payload: UpdateCustomerStatusPayload
}) {
  try {
    const validatedPayload = updateCustomerStatusPayloadSchema.parse(params.payload)
    const response = await axiosInstance.patch(
      `me/customers/${params.customerId}/status`,
      validatedPayload,
      {
        headers: getAuthHeader(),
        params: { environment: params.environment },
      },
    )
    return updateCustomerStatusResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCustomersApiErrorMessage(error))
  }
}

export async function listCustomerTransactions(params: {
  customerId: string
  environment: PortalEnvironment
  limit: number
  offset: number
}) {
  try {
    const response = await axiosInstance.get(
      `me/customers/${params.customerId}/transactions`,
      {
        headers: getAuthHeader(),
        params: {
          environment: params.environment,
          limit: params.limit,
          offset: params.offset,
        },
      },
    )
    return customerTransactionsListResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getCustomersApiErrorMessage(error))
  }
}
