import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import VoiceTest from './VoiceTest'
import SpiralTest from './SpiralTest'
import TapTest from './TapTest'

const TESTS = [
  { key: 'voiceScore', label: 'Voice Test', icon: '🎙️' },
  { key: 'spiralScore', label: 'Spiral Test', icon: '✏️' },
  { key: 'tapScore', label: 'Tap Test', icon: '👆' },
]

export default function TestsPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState({ voiceScore: null, spiralScore: null, tapScore: null })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAuthOverlay, setShowAuthOverlay] = useState(false)

  function handleTestAreaClick(e) {
    if (!currentUser) {
      e.preventDefault()
      e.stopPropagation()
      setShowAuthOverlay(true)
    }
  }

  function handleTestComplete(key, score) {
    setResults((prev) => {
      const updated = { ...prev, [key]: score }
      
      if (currentStep < 2) {
        // Auto-advance to next test shortly to allow user to see success state briefly
        setTimeout(() => setCurrentStep(prevStep => prevStep + 1), 600)
      } else {
        // All three done → submit automatically
        if (updated.voiceScore !== null && updated.spiralScore !== null && updated.tapScore !== null) {
          submitFinalScore(updated)
        }
      }
      return updated
    })
  }

  async function submitFinalScore(scores) {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await client.post('/calculate_final_score', {
        voice_score: scores.voiceScore,
        spiral_score: scores.spiralScore,
        tap_score: scores.tapScore,
      })
      sessionStorage.setItem('neuroLensResults', JSON.stringify(data))
      navigate('/results')
    } catch (e) {
      setError('Failed to calculate final score. Please try again.')
      setSubmitting(false)
    }
  }

  const completedCount = Object.values(results).filter((v) => v !== null).length

  return (
    <div className="relative max-w-3xl mx-auto px-4 py-10 mt-16">
      
      {/* Unauthenticated Overlay */}
      {(!currentUser && showAuthOverlay) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-3xl border border-slate-800 p-8 shadow-2xl min-w-[320px]">
          <span className="text-5xl mb-4 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">🔒</span>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2 text-center">Account Required</h2>
          <p className="text-slate-400 text-center max-w-sm mb-8">
            You need to create an account or sign in to take the neurological screening tests and securely save your results.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/login'); }}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
            >
              Log In
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/register'); }}
              className="bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Create Account
            </button>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowAuthOverlay(false); }}
            className="mt-6 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      <div 
        onClickCapture={!currentUser ? handleTestAreaClick : undefined}
        className={`transition-all duration-500 ${(!currentUser && showAuthOverlay) ? 'opacity-30 blur-sm pointer-events-none' : ''}`}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Neurological Screening</h1>
          <p className="text-slate-400 mt-1">
            Complete all three tests to receive your comprehensive AI movement analysis.
          </p>
        </div>

        {/* Progress tracker */}
      <div className="flex gap-4 mb-8">
        {TESTS.map(({ key, label, icon }, index) => {
          const done = results[key] !== null
          const isActive = currentStep === index
          return (
            <div
              key={key}
              className={`flex-1 text-center p-3 rounded-lg border text-sm font-medium transition-colors
                ${
                  done
                    ? 'bg-emerald-900/30 border-green-300 text-emerald-400'
                    : isActive
                    ? 'bg-blue-900/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)] scale-105'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-500 opacity-60'
                }`}
            >
              <span className="text-xl">{icon}</span>
              <p className="mt-1">{label}</p>
              <p className="text-xs">{done ? '✅ Done' : isActive ? '⏳ In Progress' : 'Pending'}</p>
            </div>
          )
        })}
      </div>

      {/* Test panels */}
      <div className="relative min-h-[400px]">
        <div className={`transition-opacity duration-300 ${submitting ? 'opacity-50 pointer-events-none' : ''}`}>
          {currentStep === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <VoiceTest onComplete={(s) => handleTestComplete('voiceScore', s)} />
            </div>
          )}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <SpiralTest onComplete={(s) => handleTestComplete('spiralScore', s)} />
            </div>
          )}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <TapTest onComplete={(s) => handleTestComplete('tapScore', s)} />
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      {error && (
        <p className="mt-6 text-center text-rose-400 text-sm">❌ {error}</p>
      )}
      {submitting && (
        <p className="mt-6 text-center text-cyan-400 animate-pulse font-medium">
          ⏳ Calculating your final score…
        </p>
      )}
      {completedCount > 0 && completedCount < 3 && (
        <p className="mt-6 text-center text-slate-500 text-sm font-medium">
          {completedCount} / 3 tests complete
        </p>
      )}
      </div>
    </div>
  )
}
