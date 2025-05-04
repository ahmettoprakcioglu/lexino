import { create } from 'zustand'
import { supabase, type SupabaseUser } from '@/lib/supabase'
import { AuthError as SupabaseAuthError } from '@supabase/supabase-js'

interface AuthError {
  message: string
  code?: string
}

interface AuthState {
  user: SupabaseUser | null
  isLoading: boolean
  error: AuthError | null
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: SupabaseUser | null) => void
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  clearError: () => void
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/

const validatePassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password)
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  signIn: async (email: string, password: string, rememberMe = false) => {
    try {
      set({ isLoading: true, error: null })

      // Clear any existing session
      await supabase.auth.signOut()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error

      // Update user state after successful sign in
      set({ user: data.user, error: null, isLoading: false })

      if (!rememberMe) {
        window.addEventListener('beforeunload', () => {
          supabase.auth.signOut()
        })
      }
    } catch (error) {
      const authError = {
        message: error instanceof Error ? error.message : 'Failed to sign in',
        code: error instanceof SupabaseAuthError ? error.code : undefined
      }
      set({ error: authError, isLoading: false, user: null })
      throw error
    }
  },
  signUp: async (email: string, password: string, fullName: string) => {
    try {
      set({ isLoading: true, error: null })

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, and numbers')
      }

      const { error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password: 'random-password-to-check-existence',
      })

      if (!checkError || checkError.message === 'Invalid login credentials') {
        throw new Error('An account with this email already exists. Please sign in instead.')
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      if (!data?.user) throw new Error('Failed to create account. Please try again.')
      if (!data.user.confirmed_at) throw new Error('Please check your email to verify your account.')

      set({ error: null, isLoading: false })
    } catch (error) {
      const authError = {
        message: error instanceof Error ? error.message : 'Failed to sign up',
        code: error instanceof SupabaseAuthError ? error.code : undefined
      }
      set({ error: authError, isLoading: false })
      throw error
    }
  },
  signOut: async () => {
    try {
      set({ isLoading: true, error: null })

      // Clear any existing session
      await supabase.auth.signOut()
      
      set({ user: null, error: null, isLoading: false })
    } catch (error) {
      const authError = {
        message: error instanceof Error ? error.message : 'Failed to sign out',
        code: error instanceof SupabaseAuthError ? error.code : undefined
      }
      set({ error: authError, isLoading: false })
      throw error
    }
  },
  setUser: (user) => set({ user, isLoading: false }),
  resetPassword: async (email: string) => {
    try {
      set({ isLoading: true, error: null })

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error

      set({ error: null, isLoading: false })
    } catch (error) {
      const authError = {
        message: error instanceof Error ? error.message : 'Failed to reset password',
        code: error instanceof SupabaseAuthError ? error.code : undefined
      }
      set({ error: authError, isLoading: false })
      throw error
    }
  },
  updatePassword: async (newPassword: string) => {
    try {
      set({ isLoading: true, error: null })

      if (!validatePassword(newPassword)) {
        throw new Error('Password must be at least 8 characters and contain uppercase, lowercase, and numbers')
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        if (error.message.toLowerCase().includes('same password')) {
          throw new Error('New password must be different from your current password')
        }
        throw error
      }

      // After successful password update, sign out
      await supabase.auth.signOut()
      set({ user: null, error: null, isLoading: false })
    } catch (error) {
      const authError = {
        message: error instanceof Error ? error.message : 'Failed to update password',
        code: error instanceof SupabaseAuthError ? error.code : undefined
      }
      set({ error: authError, isLoading: false })
      throw error
    }
  },
  clearError: () => set({ error: null }),
})) 