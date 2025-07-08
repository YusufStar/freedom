import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth as useAuthStore, useAuthActions } from '@/stores/auth'
import { 
  loginFormSchema, 
  registerFormSchema,
  LoginFormData, 
  RegisterFormData 
} from '@/types/schema'

export function useAuth() {
  const auth = useAuthStore()
  const actions = useAuthActions()
  
  return {
    ...auth,
    ...actions,
  }
}

export function useLoginForm() {
  const { login, isLoading, error, clearError } = useAuth()
  const router = useRouter()

  const form: UseFormReturn<LoginFormData> = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError()
      await login(data)
      router.push('/mail') // Redirect after successful login
    } catch (error) {
      console.error('Login error:', error)
      // Error is already handled in the store
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    error,
    clearError,
  }
}

export function useRegisterForm() {
  const { register, isLoading, error, clearError } = useAuth()
  const router = useRouter()

  const form: UseFormReturn<RegisterFormData> = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      // Remove confirmPassword before sending to API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...registerData } = data
      await register(registerData)
      router.push('/mail') // Redirect after successful registration
    } catch (error) {
      console.error('Registration error:', error)
      // Error is already handled in the store
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isLoading,
    error,
    clearError,
  }
}

export function useAuthGuard() {
  const { isAuthenticated, hasHydrated, isLoading } = useAuth()
  const router = useRouter()

  // Check if we should redirect to login
  const shouldRedirect = hasHydrated && !isAuthenticated && !isLoading

  const redirectToLogin = () => {
    router.push('/login')
  }

  const redirectToDashboard = () => {
    router.push('/dashboard')
  }

  return {
    isAuthenticated,
    hasHydrated,
    isLoading,
    shouldRedirect,
    redirectToLogin,
    redirectToDashboard,
  }
}

export function useLogout() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return { logout: handleLogout }
}

// Hook to get current user with real-time updates
export function useCurrentUser() {
  const { user, isAuthenticated, hasHydrated } = useAuth()
  
  return {
    user,
    isAuthenticated,
    hasHydrated,
    isLoading: !hasHydrated,
  }
}

// Hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated after hydration
  if (hasHydrated && !isAuthenticated) {
    router.push('/login')
    return { isLoading: true, isAuthenticated: false }
  }

  return {
    isLoading: !hasHydrated,
    isAuthenticated,
  }
}

// Hook for public routes (redirect if already authenticated)
export function useRequireGuest() {
  const { isAuthenticated, hasHydrated } = useAuth()
  const router = useRouter()

  // Use useEffect to redirect after render, not during render
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.push('/mail')
    }
  }, [hasHydrated, isAuthenticated, router])

  return {
    isLoading: !hasHydrated,
    isAuthenticated,
  }
} 