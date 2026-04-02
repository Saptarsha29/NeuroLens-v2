import { useState, useRef, useEffect } from 'react'
import client from '../api/client'

const TEST_DURATION = 10000 // ms — matches original tap.js

function scoreLabel(score) {
  if (score >= 80) return 'Motor response shows good speed and consistency'
  if (score >= 60) return 'Some minor irregularities in tapping rhythm'
  return 'Motor response analysis shows notable irregularities'
}

export default function TapTest({ onComplete }) {
  const [phase, setPhase] = useState('idle') // idle | countdown | active | done | error
  const [countdown, setCountdown] = useState(3)
  const [timeLeft, setTimeLeft] = useState(10.0)
  const [tapCount, setTapCount] = useState(0)
  const [score, setScore] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')
  const [tapped, setTapped] = useState(false) // visual feedback

  const tapTimesRef = useRef([])
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearInterval(countdownRef.current)
  }, [])

  function startTest() {
    setError('')
    tapTimesRef.current = []
    setTapCount(0)
    setTimeLeft(10.0)
    setScore(null)
    setPhase('countdown')
    setCountdown(3)

    let count = 3
    countdownRef.current = setInterval(() => {
      count--
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(countdownRef.current)
        beginActive()
      }
    }, 1000)
  }

  function beginActive() {
    startTimeRef.current = Date.now()
    setPhase('active')

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, TEST_DURATION - elapsed)
      setTimeLeft(remaining / 1000)
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        endTest()
      }
    }, 100)
  }

  function handleTap() {
    if (phase !== 'active') return
    const t = Date.now() - startTimeRef.current
    tapTimesRef.current.push(t)
    setTapCount((c) => c + 1)

    // Brief visual feedback
    setTapped(true)
    setTimeout(() => setTapped(false), 80)
  }

  async function endTest() {
    setPhase('done')
    if (tapTimesRef.current.length < 3) {
      setError('Not enough taps recorded. Please try again.')
      setPhase('error')
      return
    }
    try {
      const { data } = await client.post('/analyze_tap', { tap_times: tapTimesRef.current })
      if (data.success) {
        setScore(data.tap_score)
        setMetrics(data.metrics)
        onComplete(data.tap_score)
      } else {
        throw new Error(data.detail || 'Analysis failed')
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Error analysing tap data')
      setPhase('error')
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">👆 Tap Speed Test</h2>
      <p className="text-sm text-slate-400 mb-4">
        Press <strong>Start</strong>, wait for the countdown, then tap the button as fast as you can
        for 10 seconds.
      </p>

      {/* Timer + count row */}
      <div className="flex gap-8 mb-4 text-center">
        <div>
          <p className="text-xs text-slate-500">Time left</p>
          <p className="text-3xl font-mono font-bold text-slate-100">
            {phase === 'countdown' ? countdown : timeLeft.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Taps</p>
          <p className="text-3xl font-mono font-bold text-primary">{tapCount}</p>
        </div>
      </div>

      {/* Tap button */}
      <button
        onClick={handleTap}
        disabled={phase !== 'active'}
        className={`w-48 h-48 rounded-full text-white text-2xl font-bold transition-transform mx-auto block
          ${phase === 'active'
            ? tapped
              ? 'bg-blue-700 scale-95'
              : 'bg-primary hover:bg-blue-600 scale-100'
            : 'bg-gray-300 cursor-not-allowed'}
        `}
      >
        {phase === 'countdown' ? countdown : phase === 'active' ? 'TAP!' : phase === 'done' ? 'Done' : 'TAP'}
      </button>

      <div className="mt-4 text-center">
        <button
          onClick={startTest}
          disabled={phase === 'countdown' || phase === 'active'}
          className="btn-primary"
        >
          {phase === 'idle' || phase === 'error' ? 'Start Test' : 'Restart'}
        </button>
      </div>

      {error && <p className="text-sm text-rose-400 mt-3">❌ {error}</p>}

      {phase === 'done' && score !== null && (
        <div className="mt-4 p-4 bg-emerald-900/30 border border-emerald-500/20 rounded-lg">
          <p className="font-semibold text-emerald-400">✅ Tap Analysis Complete</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{score.toFixed(1)} / 100</p>
          <p className="text-sm text-slate-400 mt-1">{scoreLabel(score)}</p>
          {metrics && (
            <div className="flex gap-4 mt-2 text-xs text-slate-500 flex-wrap">
              <span>Total taps: {metrics.total_taps}</span>
              <span>Taps/sec: {metrics.taps_per_second.toFixed(2)}</span>
              <span>Rhythm consistency: {(1 - metrics.rhythm_consistency).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
