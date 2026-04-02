import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useVerification } from '../contexts/VerificationContext'
import { useAuth } from '../contexts/AuthContext'

export default function EmailVerification() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()
  const {
    verifyCode,
    sendVerificationCode,
    loading,
    error,
    attemptsLeft,
    verificationSent,
    email,
    isVerified,
  } = useVerification()

  const [code, setCode] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const emailFromState = location.state?.email || email || currentUser?.email

  // Redirect if already verified
  useEffect(() => {
    if (isVerified) {
      navigate('/dashboard')
    }
  }, [isVerified, navigate])

  // Handle cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Send verification code on mount if not already sent
  useEffect(() => {
    if (!verificationSent && emailFromState && currentUser) {
      sendVerificationCode(emailFromState)
    }
  }, [emailFromState, currentUser, verificationSent, sendVerificationCode])

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) {
      return
    }

    const result = await verifyCode(code)
    if (result.success) {
      setSuccessMessage('Email verified successfully! Redirecting to dashboard...')
      setTimeout(() => navigate('/dashboard'), 1500)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !emailFromState) return

    setResendLoading(true)
    await sendVerificationCode(emailFromState)
    setResendLoading(false)
    setResendCooldown(60)
    setCode('')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">✉️</span>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">Verify your email</h1>
          <p className="text-slate-400 text-sm mt-1">
            We sent a code to <span className="font-medium">{emailFromState}</span>
          </p>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-900/30 border border-rose-500/20 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              6-digit code
              {attemptsLeft !== undefined && (
                <span className="text-xs text-slate-400 ml-2">
                  ({attemptsLeft} attempts left)
                </span>
              )}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              className="input text-center text-2xl tracking-widest font-mono"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              disabled={loading || successMessage}
            />
            <p className="text-xs text-slate-400 mt-1 text-center">
              Enter the 6-digit code (expires in 10 minutes)
            </p>
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || loading || successMessage}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-300 mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="text-primary font-medium hover:underline text-sm disabled:text-slate-500"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  )
}
