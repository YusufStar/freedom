export interface User {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

export interface AuthResponse {
  success?: boolean
  message?: string
  user: User
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthError {
  success: false
  error: string
  code?: number
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
} 