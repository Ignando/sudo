import { createContext, useContext, useMemo, useState } from 'react'
import { authApi } from '../data'
import type { AuthUserResponse } from '../data/types'

export type AuthUser = AuthUserResponse

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const storageKey = 'sudo-auth-user'

function readStoredUser(): AuthUser | null {
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (!stored) return null
    const user = JSON.parse(stored) as AuthUser
    if (!Number.isSafeInteger(user.userId) || !user.firstName || !user.lastName || !user.email
      || (user.role !== 'Admin' && user.role !== 'Customer')) return null
    return user
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  async function login(email: string, password: string): Promise<AuthUser> {
    const result = await authApi.login(email, password)
    sessionStorage.setItem(storageKey, JSON.stringify(result))
    setUser(result)
    return result
  }

  function logout() {
    sessionStorage.removeItem(storageKey)
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider.')
  return context
}
