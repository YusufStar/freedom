import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authApi } from '@/lib/api'
import { ApiError } from '@/lib/axios'
import { 
  AuthState, 
  AuthActions, 
  LoginRequest, 
  RegisterRequest, 
  User 
} from '@/types/auth'

interface AuthStore extends AuthState, AuthActions {
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      // Actions
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state })
      },

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.login(credentials)
          
          // Check if response has user and token (backend doesn't send success field)
          if (response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error('Login failed')
          }
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : 'Login failed. Please try again.'
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authApi.register(data)
          
          // Check if response has user and token (backend doesn't send success field)
          if (response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } else {
            throw new Error('Registration failed')
          }
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : 'Registration failed. Please try again.'
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'freedom-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.log('Auth rehydration error:', error)
          } else {
            console.log('Auth rehydration finished')
            state?.setHasHydrated(true)
            
            // Verify token on rehydration
            if (state?.token) {
              authApi.verifyToken(state.token).then((isValid) => {
                if (!isValid) {
                  state.logout()
                }
              })
            }
          }
        }
      },
    }
  )
)

// Utility hooks
export const useAuth = () => {
  const auth = useAuthStore()
  return {
    ...auth,
    hasHydrated: auth._hasHydrated,
  }
}

export const useUser = (): User | null => useAuthStore((state) => state.user)

export const useIsAuthenticated = (): boolean => useAuthStore((state) => state.isAuthenticated)

export const useAuthActions = () => {
  const { login, register, logout, clearError, setLoading } = useAuthStore()
  return { login, register, logout, clearError, setLoading }
} 