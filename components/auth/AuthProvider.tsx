"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/lib/types'
import { getToken, getUser, logout, setToken, setUser } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth on mount
    const token = getToken()
    const userData = getUser()
    
    if (token && userData) {
      setUser(userData)
    }
    
    setLoading(false)
  }, [])

  const handleLogin = (userData: User, token: string) => {
    setToken(token)
    setUser(userData)
    setUser(userData)
  }

  const handleLogout = () => {
    logout()
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login: handleLogin,
    logout: handleLogout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 