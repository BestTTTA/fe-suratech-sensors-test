"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  console.log('ProtectedRoute - Loading:', loading)
  console.log('ProtectedRoute - IsAuthenticated:', isAuthenticated)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('ProtectedRoute - Redirecting to login (not authenticated)')
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Show loading while checking authentication
  if (loading) {
    console.log('ProtectedRoute - Showing loading...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-white">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, not rendering')
    return null
  }

  console.log('ProtectedRoute - Rendering protected content')
  return <>{children}</>
} 