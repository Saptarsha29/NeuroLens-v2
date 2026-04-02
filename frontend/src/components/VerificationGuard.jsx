import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useVerification } from '../contexts/VerificationContext'
import { useEffect } from 'react'

export default function VerificationGuard() {
  const { currentUser, loading: authLoading } = useAuth()
  const { isVerified, getVerificationStatus, loading: verifyLoading } = useVerification()

  // Check verification status when user logs in
  useEffect(() => {
    if (currentUser && !isVerified) {
      getVerificationStatus()
    }
  }, [currentUser, isVerified, getVerificationStatus])

  // Wait for auth to fully load
  if (authLoading || verifyLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Redirect to email verification if not verified
  if (!isVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // User is authenticated and verified
  return <Outlet />
}
