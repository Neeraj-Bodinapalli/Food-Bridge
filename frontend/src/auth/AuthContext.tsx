import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch } from '../api'
import type { User } from '../types'

const STORAGE_KEY = 'foodbridge_token'

type AuthContextValue = {
  token: string | null
  user: User | null
  loading: boolean
  login: (phone: string, password: string) => Promise<void>
  register: (input: {
    role: 'provider' | 'recipient' | 'volunteer'
    name: string
    phone: string
    password: string
    lat?: number
    lng?: number
  }) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    const r = await apiFetch('/api/auth/me', { token })
    if (!r.ok) {
      localStorage.removeItem(STORAGE_KEY)
      setToken(null)
      setUser(null)
      setLoading(false)
      return
    }
    const data = (await r.json()) as { user: User }
    setUser(data.user)
    setLoading(false)
  }, [token])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const login = useCallback(async (phone: string, password: string) => {
    const r = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      throw new Error((data as { error?: string }).error ?? 'Login failed')
    }
    const t = (data as { token: string; user: User }).token
    const u = (data as { token: string; user: User }).user
    localStorage.setItem(STORAGE_KEY, t)
    setToken(t)
    setUser(u)
  }, [])

  const register = useCallback(
    async (input: {
      role: 'provider' | 'recipient' | 'volunteer'
      name: string
      phone: string
      password: string
      lat?: number
      lng?: number
    }) => {
      const r = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        throw new Error((data as { error?: string }).error ?? 'Registration failed')
      }
      const { token: t, user: u } = data as { token: string; user: User }
      localStorage.setItem(STORAGE_KEY, t)
      setToken(t)
      setUser(u)
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [token, user, loading, login, register, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
