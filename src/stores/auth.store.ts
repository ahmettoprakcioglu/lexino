import { create } from 'zustand'
import { supabase, type SupabaseUser } from '@/lib/supabase'

interface AuthState {
  user: SupabaseUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: SupabaseUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  },
  signUp: async (email: string, password: string, fullName: string) => {
    // First check if the email exists by trying to sign in with a random password
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password: 'random-password-to-check-existence',
    })

    // If there's no error or the error is about wrong password, the email exists
    if (!checkError || checkError.message === 'Invalid login credentials') {
      throw new Error('An account with this email already exists. Please sign in instead.')
    }

    // If we get here, the email doesn't exist, proceed with signup
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

    if (error) {
      throw error
    }

    // If no error but also no user data, something went wrong
    if (!data?.user) {
      throw new Error('Failed to create account. Please try again.')
    }

    // Check if email confirmation is required
    if (!data.user.confirmed_at) {
      throw new Error('Please check your email to verify your account.')
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null })
  },
  setUser: (user) => set({ user, isLoading: false }),
})) 