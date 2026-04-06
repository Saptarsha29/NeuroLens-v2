import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import VoiceTest from './VoiceTest'
import SpiralTest from './SpiralTest'
import TapTest from './TapTest'

const TESTS = [
  {
    key: 'voiceScore',
    label: 'Voice Stability Test',
    desc: 'An analysis of vocal cord consistency and micro-tremors through sustained phonation.',
    instructions: [
      'Find a quiet environment to minimize background noise.',
      'Click start and say "I\'M FULLY FIT" in a steady tone.',
      'Maintain the consistent vocal tone until the recording stops.'
    ]
  },
  {
    key: 'spiralScore',
    label: 'Spiral Drawing Test',
    desc: 'A precise assessment of fine motor control and resting tremor reduction.',
    instructions: [
      'Use your dominant hand, ideally on a touch device or using a steady mouse.',
      'Trace or draw a continuous spiral from the center outwards.',
      'Try to keep the distance between lines as even as possible.'
    ]
  },
  {
    key: 'tapScore',
    label: 'Finger Tapping Test',
    desc: 'A precise measurement of motor speed and rhythmicity through repetitive stimulus-response.',
    instructions: [
      'Place your dominant hand comfortably on a flat surface.',
      'Tap the central sensor area with your index finger as fast as possible.',
      'Maintain consistent rhythm until the timer reaches zero.'
    ]
  },
]

export default function TestsPage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState({ voiceScore: null, spiralScore: null, tapScore: null })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function handleTestComplete(key, score) {
    setResults((prev) => ({ ...prev, [key]: score }))
  }

  function handleNextStep() {
    if (currentStep < 2) setCurrentStep(prev => prev + 1)
    else if (results.voiceScore !== null && results.spiralScore !== null && results.tapScore !== null) {
      submitFinalScore(results)
    }
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

  const currentTestData = TESTS[currentStep]
  const pct = Math.round(((currentStep + 1) / 3) * 100)

  // Force a full clean light-themed UI structure overlapping any global layout
  return (
    <div className="fixed inset-0 z-50 bg-[#f4f8fb] text-slate-800 overflow-y-auto font-sans flex items-center justify-center p-4">
      
      {!currentUser ? (
        <div className="bg-white rounded-[2rem] p-10 shadow-2xl shadow-blue-900/10 flex flex-col items-center max-w-md w-full text-center">
          <span className="text-5xl mb-6">🔒</span>
          <h2 className="text-3xl font-bold text-[#03344b] tracking-tight mb-4">Account Required</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            You need to create an account or sign in to take the neurological screening tests and securely save your results.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => navigate('/login')}
              className="bg-[#03344b] hover:bg-[#022130] text-white px-6 py-4 rounded-2xl font-semibold transition-all shadow-md active:scale-95"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-blue-50 hover:bg-blue-100 text-[#03344b] px-6 py-4 rounded-2xl font-semibold transition-all active:scale-95"
            >
              Create Account
            </button>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 text-slate-400 hover:text-[#03344b] transition-colors text-sm font-medium uppercase tracking-wider"
            >
              Return Home
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[1400px] h-[90vh] min-h-[800px] bg-[#f4f8fb] flex flex-col lg:flex-row gap-8 lg:gap-16 items-stretch">
          
          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-[380px] flex flex-col pt-4 pb-8 h-full shrink-0">
            {/* Live Session Pill */}
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-8 w-max uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Session
            </div>

            <h1 className="text-[2.75rem] leading-[1.1] font-extrabold text-[#03344b] mb-4 tracking-tight">
              {currentTestData.label}
            </h1>
            <p className="text-slate-500 text-[0.95rem] leading-relaxed mb-10 max-w-xs">
              {currentTestData.desc}
            </p>

            {/* Progress Card */}
            <div className="bg-[#eaf4fa] rounded-3xl p-6 mb-12 border border-blue-100/50">
              <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-[#03344b] opacity-80 mb-3">
                Current Progress
              </h3>
              <div className="flex justify-between items-end mb-4">
                <div className="text-[#03344b] font-bold text-xl">
                  Step {currentStep + 1} of 3
                </div>
                <div className="text-blue-400/80 font-light text-3xl">
                  {pct}%
                </div>
              </div>
              <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-[#03344b] transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="flex-1">
              <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-[#7fb8c9] mb-6">
                Instructions
              </h3>
              <div className="flex flex-col gap-6">
                {currentTestData.instructions.map((inst, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-[#03344b] flex items-center justify-center font-bold text-sm shrink-0 shadow-sm mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-slate-600 text-[0.95rem] leading-relaxed">
                      {inst}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => navigate('/')} className="mt-12 text-sm text-slate-400 hover:text-slate-700 font-medium text-left w-max transition-colors">
              ← Exit Screening
            </button>
          </div>

          {/* RIGHT PANEL - Passed down as children essentially */}
          <div className="flex-1 flex flex-col h-full relative">
            <div className="flex-1 transition-opacity duration-300 w-full h-full">
              {currentStep === 0 && <VoiceTest onComplete={(s) => handleTestComplete('voiceScore', s)} />}
              {currentStep === 1 && <SpiralTest onComplete={(s) => handleTestComplete('spiralScore', s)} />}
              {currentStep === 2 && <TapTest onComplete={(s) => handleTestComplete('tapScore', s)} />}
            </div>

            {/* Next / Submit Overlay Bar */}
            {results[currentTestData.key] !== null && (
               <div className="absolute inset-x-0 bottom-8 flex justify-center animate-in fade-in slide-in-from-bottom-5 duration-500 z-50">
                <button
                  onClick={handleNextStep}
                  disabled={submitting}
                  className="bg-[#03344b] hover:bg-[#021f2d] text-white px-10 py-5 rounded-full shadow-[0_10px_40px_-10px_rgba(3,52,75,0.6)] hover:shadow-[0_10px_40px_-5px_rgba(3,52,75,0.7)] transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  <span className="font-bold text-lg tracking-wide">
                    {submitting ? 'Finalizing...' : (currentStep < 2 ? 'Continue to Next Test' : 'Submit Final Results')}
                  </span>
                  {!submitting && (
                    <span className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center translate-x-1 group-hover:translate-x-2 transition-transform">
                      {currentStep < 2 ? '→' : '✨'}
                    </span>
                  )}
                </button>
              </div>
            )}
            
            {error && (
              <div className="absolute top-4 right-4 bg-rose-100 text-rose-700 px-6 py-3 rounded-2xl shadow-lg font-medium text-sm border border-rose-200">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
