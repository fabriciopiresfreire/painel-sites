import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseReady } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  ready: boolean
  signInEmail: (email: string, senha: string) => Promise<{ error: string | null }>
  signUpEmail: (email: string, senha: string) => Promise<{ error: string | null }>
  signInGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (novaSenha: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInEmail = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    return { error: error?.message ?? null }
  }

  const signUpEmail = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signUp({ email, password: senha })
    return { error: error?.message ?? null }
  }

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updatePassword = async (novaSenha: string) => {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        ready: supabaseReady,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
