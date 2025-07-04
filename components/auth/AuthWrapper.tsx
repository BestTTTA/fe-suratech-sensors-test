"use client"

import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import ProtectedRoute from './ProtectedRoute'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname()
  const { loading, isAuthenticated } = useAuth()
  
  // Check if current path is an auth page
  const isAuthPage = pathname === '/login' || pathname === '/auth/register'
  
  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }
  
  // For auth pages, render without protection
  if (isAuthPage) {
    return <>{children}</>
  }
  
  // For all other pages, use protection
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-gray-900 p-4">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
} 