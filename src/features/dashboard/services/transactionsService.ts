import { AxiosError } from 'axios'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import { getAuthToken } from '../../auth/services/authSession.ts'
import {
  createRefundPayloadSchema,
  createTransferPayloadSchema,
  transactionDetailSchema,
  transactionsListResponseSchema,
  type CreateRefundPayload,
  type CreateTransferPayload,
  type TransactionStatus,
  type TransactionType,
} from './transactionsSchemas.ts'

function getTransactionsApiErrorMessage(error: unknown) {
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
  return 'Unable to complete this transaction request right now.'
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

export async function listTransactions(params: {
  type?: TransactionType
  status?: TransactionStatus
  customerId?: string
  limit: number
  offset: number
}) {
  try {
    const response = await axiosInstance.get('me/transactions', {
      headers: getAuthHeader(),
      params,
    })
    return transactionsListResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getTransactionsApiErrorMessage(error))
  }
}

export async function getTransaction(transactionId: string) {
  try {
    const response = await axiosInstance.get(`me/transactions/${transactionId}`, {
      headers: getAuthHeader(),
    })
    return transactionDetailSchema.parse(response.data)
  } catch (error) {
    throw new Error(getTransactionsApiErrorMessage(error))
  }
}

export async function createTransfer(payload: CreateTransferPayload) {
  try {
    const validatedPayload = createTransferPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/transfers', validatedPayload, {
      headers: getAuthHeader(),
    })
    return transactionDetailSchema.parse(response.data)
  } catch (error) {
    throw new Error(getTransactionsApiErrorMessage(error))
  }
}

export async function createRefund(payload: CreateRefundPayload) {
  try {
    const validatedPayload = createRefundPayloadSchema.parse(payload)
    const response = await axiosInstance.post('me/refunds', validatedPayload, {
      headers: getAuthHeader(),
    })
    return transactionDetailSchema.parse(response.data)
  } catch (error) {
    throw new Error(getTransactionsApiErrorMessage(error))
  }
}
