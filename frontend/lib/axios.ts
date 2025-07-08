import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get current auth state
    const state = useAuthStore.getState()
    
    // Add token to headers if it exists
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`
    }
    
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`)
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error: AxiosError) => {
    const state = useAuthStore.getState()
    
    console.error(`❌ ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
    
    // Handle 401 Unauthorized - Invalid or expired token
    if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized access - logging out user')
      state.logout()
      
      // Only redirect if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('🚫 Forbidden access')
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.warn('🔍 Resource not found')
    }
    
    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('🔥 Server error')
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error - server might be down')
    }
    
    return Promise.reject(error)
  }
)

// Export custom error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: AxiosResponse
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static fromAxiosError(error: AxiosError): ApiError {
    const errorData = error.response?.data as { error?: string } | undefined
    const message = errorData?.error || error.message || 'An error occurred'
    const status = error.response?.status
    const code = error.code
    
    return new ApiError(message, status, code, error.response)
  }
}

// Helper function to handle axios errors consistently
export const handleAxiosError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    throw ApiError.fromAxiosError(error)
  }
  
  throw new ApiError(error instanceof Error ? error.message : 'Unknown error')
}

// Export the configured axios instance
export default api

// Export additional utilities
export { axios }

// Type for API responses based on your backend
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  code?: number
}

// Generic request wrapper with proper error handling
export const apiRequest = {
  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.get<T>(url, config)
      return response.data
    } catch (error) {
      return handleAxiosError(error)
    }
  },

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.post<T>(url, data, config)
      return response.data
    } catch (error) {
      return handleAxiosError(error)
    }
  },

  async put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.put<T>(url, data, config)
      return response.data
    } catch (error) {
      return handleAxiosError(error)
    }
  },

  async patch<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      return handleAxiosError(error)
    }
  },

  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    try {
      const response = await api.delete<T>(url, config)
      return response.data
    } catch (error) {
      return handleAxiosError(error)
    }
  },
} 