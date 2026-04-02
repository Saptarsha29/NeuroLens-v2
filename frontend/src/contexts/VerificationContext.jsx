import { createContext, useContext, useState, useCallback, useRef } from 'react'
import apiClient from '../api/client'

const VerificationContext = createContext(null)

export function VerificationProvider({ children }) {
  const [isVerified, setIsVerified] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState(5)
  const [verificationSent, setVerificationSent] = useState(false)
  const sendLockRef = useRef(false)

  const sendVerificationCode = useCallback(async (emailAddress) => {
    if (sendLockRef.current) return { success: false, message: 'Request in progress' }
    sendLockRef.current = true
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post('/send_verification_code', {
        email: emailAddress,
      })
      if (response.data.success) {
        setEmail(emailAddress)
        setVerificationSent(true)
        return { success: true, ...response.data }
      } else {
        throw new Error(response.data.message || 'Failed to send code')
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to send verification code'
      setError(message)
      return { success: false, message }
    } finally {
      setLoading(false)
      sendLockRef.current = false
    }
  }, [])

  const verifyCode = useCallback(async (code) => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post('/verify_email_code', {
        code,
      })
      if (response.data.success) {
        setIsVerified(true)
        return { success: true, ...response.data }
      } else {
        throw new Error(response.data.message || 'Failed to verify code')
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      const message = detail || err.message || 'Failed to verify code'
      setError(message)
      if (err.response?.data?.detail?.includes('Invalid')) {
        const attemptsMsg = err.response?.data?.attempts_left
        if (attemptsMsg !== undefined) {
          setAttemptsLeft(attemptsMsg)
        }
      }
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const getVerificationStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/verification_status')
      if (response.data.success) {
        setIsVerified(response.data.email_verified)
        setEmail(response.data.email || '')
        if (response.data.attempts_left !== undefined) {
          setAttemptsLeft(response.data.attempts_left)
        }
        return response.data
      }
      return null
    } catch (err) {
      console.error('Failed to get verification status:', err)
      return null
    }
  }, [])

  const value = {
    isVerified,
    email,
    loading,
    error,
    attemptsLeft,
    verificationSent,
    sendVerificationCode,
    verifyCode,
    getVerificationStatus,
    setError,
  }

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  )
}

export function useVerification() {
  const context = useContext(VerificationContext)
  if (!context) {
    throw new Error('useVerification must be used within VerificationProvider')
  }
  return context
}
