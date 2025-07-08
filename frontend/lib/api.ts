import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'
import axiosInstance, { ApiError, apiRequest } from '@/lib/axios'

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiRequest.post<AuthResponse>('/login', credentials)
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return apiRequest.post<AuthResponse>('/register', data)
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      // Temporarily set token for this specific request
      const response = await axiosInstance.get('/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return response.status === 200
    } catch {
      return false
    }
  },

  async getAccounts() {
    return apiRequest.get('/accounts')
  },

  async getEmails(params?: {
    accountId?: string
    page?: number
    limit?: number
    folder?: string
    unread?: boolean
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.accountId) queryParams.append('accountId', params.accountId)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.folder) queryParams.append('folder', params.folder)
    if (params?.unread !== undefined) queryParams.append('unread', params.unread.toString())

    const url = `/emails${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiRequest.get(url)
  },

  async getEmail(emailId: string) {
    return apiRequest.get(`/emails/${emailId}`)
  },

  async syncEmails(accountId?: string) {
    return apiRequest.post('/sync', accountId ? { accountId } : undefined)
  },

  async getSyncStatus() {
    return apiRequest.get('/sync/status')
  },

  async createMailbox(data: {
    localPart: string
    password: string
    name: string
  }) {
    return apiRequest.post('/mailbox/create', data)
  },

  async connectMailbox(data: {
    email: string
    password: string
  }) {
    return apiRequest.post('/mailbox/connect', data)
  },

  async getHealth() {
    return apiRequest.get('/health')
  },

  async getThreadCount(params: { accountId: string; folder: string }) {
    const { accountId, folder } = params
    const query = new URLSearchParams({ accountId, folder })
    return apiRequest.get<{ count: number }>(`/threads/count?${query.toString()}`)
  },
}

// Re-export everything for convenience
export const api = {
  auth: authApi,
  mail: {
    getAccounts: authApi.getAccounts,
    getEmails: authApi.getEmails,
    getEmail: authApi.getEmail,
    syncEmails: authApi.syncEmails,
    getSyncStatus: authApi.getSyncStatus,
    createMailbox: authApi.createMailbox,
    connectMailbox: authApi.connectMailbox,
    getThreadCount: authApi.getThreadCount,
  },
  system: {
    getHealth: authApi.getHealth,
  }
}

export { ApiError } 