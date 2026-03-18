import { AxiosError } from 'axios'
import { z } from 'zod'
import { axiosInstance } from '../../../api/axiosInstance.ts'
import {
  apiErrorSchema,
  authResponseSchema,
  loginRequestSchema,
  logoutResponseSchema,
  signupRequestSchema,
  type LoginRequest,
  type SignupRequest,
} from './authSchemas.ts'
import { getAuthToken } from './authSession.ts'

function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError && error.response?.data) {
    const parsed = apiErrorSchema.safeParse(error.response.data)
    if (parsed.success) {
      return parsed.data.message
    }
  }
  return 'Something went wrong. Please try again.'
}

export async function login(payload: LoginRequest) {
  try {
    const validatedPayload = loginRequestSchema.parse(payload)
    const response = await axiosInstance.post('auth/login', validatedPayload)
    return authResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}

export async function signup(payload: SignupRequest) {
  try {
    const validatedPayload = signupRequestSchema.parse(payload)
    const response = await axiosInstance.post('auth/signup', validatedPayload)
    return authResponseSchema.parse(response.data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Please check your input fields and try again.')
    }
    throw new Error(getApiErrorMessage(error))
  }
}

export async function logout() {
  try {
    const token = getAuthToken()
    const response = await axiosInstance.post(
      'auth/logout',
      undefined,
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    )
    return logoutResponseSchema.parse(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
