"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@/lib/types'
import { getToken, getUser, logout, setToken, setUser as setUserStorage } from '@/lib/auth'

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

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = getToken()
        const userData = getUser()
        
        console.log('Auth initialization - Token:', token ? 'exists' : 'missing')
        console.log('Auth initialization - User data:', userData ? 'exists' : 'missing')
        
        if (token && userData) {
          console.log('Setting authenticated user:', userData)
          setUser(userData)
        } else {
          console.log('No valid auth data found')
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Initialize immediately
    initializeAuth()
  }, [])

  const handleLogin = (userData: User, token: string) => {
    console.log('Login - Storing token and user data')
    try {
      setToken(token)
      setUserStorage(userData)
      setUser(userData)
      console.log('Login - Auth state updated successfully')
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const handleLogout = () => {
    console.log('Logout - Clearing auth data')
    try {
      logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
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