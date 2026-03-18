import axios from 'axios'
import { getPortalApiBaseUrl } from '../config/env.ts'

export const axiosInstance = axios.create({
  baseURL: getPortalApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})
