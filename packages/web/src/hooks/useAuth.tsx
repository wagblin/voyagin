import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '@/lib/authApi'
import { clearAuth, getStoredAuth, storeAuth, type StoredUser } from '@/lib/authStorage'

interface AuthContextValue {
  user: StoredUser | null
  isAuthenticated: boolean
  login: (input: authApi.LoginInput) => Promise<void>
  register: (input: authApi.RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredAuth()?.user ?? null)

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login: async (input) => {
        const response = await authApi.login(input)
        storeAuth(response.token, response.user)
        setUser(response.user)
      },
      register: async (input) => {
        const response = await authApi.register(input)
        storeAuth(response.token, response.user)
        setUser(response.user)
      },
      logout: async () => {
        try {
          await authApi.logout()
        } finally {
          clearAuth()
          setUser(null)
        }
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
