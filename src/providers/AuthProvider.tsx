import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface AuthContextType {
  session: Session | null
  user: User | null
  userId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email)
      }

      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
    })

    return () => subscription.unsubscribe()
  }, [isConfigured])

  const signInWithGoogle = async () => {
    if (!isConfigured) {
      console.error('Supabase is not configured')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (!isConfigured) return

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    session,
    user,
    userId: user?.id ?? null,
    isLoading,
    isAuthenticated: !!session,
    isConfigured,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
