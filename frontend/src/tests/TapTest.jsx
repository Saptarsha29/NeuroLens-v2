import { useState, useRef, useEffect } from 'react'
import client from '../api/client'
import { Timer, MousePointerClick, RefreshCcw } from 'lucide-react'

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
      // Fake delay or real call
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
    <div className="h-full flex flex-col pt-4 pb-8 pl-[4%]">
      
      {/* TOP HEADER CARDS */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 mt-6 lg:mt-0">
        {/* Timer Card */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex justify-between items-center">
          <div>
            <h3 className="text-[0.65rem] font-bold text-[#03344b] uppercase tracking-[0.2em] mb-1">Time Remaining</h3>
            <div className="flex items-baseline">
              <span className="text-[2.5rem] font-bold text-[#03344b] leading-tight">
                {phase === 'countdown' ? countdown : timeLeft.toFixed(1)}
              </span>
              <span className="text-[#7fb8c9] font-medium text-lg ml-1">s</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#f0f7fb] flex items-center justify-center">
            <Timer className="w-6 h-6 text-[#03344b]" strokeWidth={2.5} />
          </div>
        </div>

        {/* Tap Count Card */}
        <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 flex justify-between items-center">
          <div>
            <h3 className="text-[0.65rem] font-bold text-[#03344b] uppercase tracking-[0.2em] mb-1">Tap Count</h3>
            <div className="flex items-baseline">
              <span className="text-[2.5rem] font-bold text-[#03344b] leading-tight">
                {String(tapCount).padStart(3, '0')}
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#e8f6ed] flex items-center justify-center">
            <MousePointerClick className="w-6 h-6 text-emerald-700" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* CENTRAL TEST AREA */}
      <div className="flex-1 relative w-full mb-6 flex justify-center items-center">
        {/* Decoration Back Layers */}
        <div className="absolute inset-0 bg-white/40 rounded-[3rem] scale-[0.98] -translate-y-4"></div>
        <div className="absolute inset-0 bg-[#f8fbff]/60 rounded-[3rem] scale-[0.95] -translate-y-8 blur-sm"></div>
        
        {/* Main Card */}
        <div className="relative w-full h-full bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(2,30,45,0.05)] border border-[#eaf4fa] flex flex-col justify-center items-center overflow-hidden p-8 px-6 lg:px-16 text-center">
          
          {phase === 'idle' || phase === 'error' ? (
            <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center">
              <button
                onClick={startTest}
                className="w-32 h-32 rounded-full border-2 border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all hover:scale-105 group mb-8"
              >
                <div className="text-slate-300 group-hover:text-cyan-400 transition-colors">
                  <MousePointerClick className="w-10 h-10" />
                </div>
              </button>
              <h2 className="text-[#03344b] text-2xl font-bold mb-2">Tap to Begin</h2>
              <p className="text-slate-500 text-sm">Use index finger of dominant hand</p>
              {error && <p className="text-rose-500 text-sm mt-4 p-3 bg-rose-50 rounded-xl">❌ {error}</p>}
              {phase === 'error' && score !== null && (
                 <button onClick={startTest} className="mt-8 text-sm font-semibold text-[#03344b] opacity-60 hover:opacity-100 flex items-center gap-2 transition-opacity">
                    <RefreshCcw className="w-4 h-4" /> Restart Test
                 </button>
              )}
            </div>
          ) : phase === 'done' ? (
            <div className="animate-in fade-in duration-500 flex flex-col items-center w-full max-w-sm">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                    <span className="text-emerald-500 text-4xl">✅</span>
                </div>
                <h2 className="text-[#03344b] text-2xl font-bold mb-2">Test Complete</h2>
                <div className="w-full bg-[#f4f8fb] rounded-2xl p-6 mt-4">
                  <p className="text-4xl font-extrabold text-[#03344b]">{score?.toFixed(1)} <span className="text-xl text-slate-400 font-medium">/ 100</span></p>
                  <p className="text-slate-500 text-sm mt-3 leading-relaxed">{scoreLabel(score)}</p>
                </div>
            </div>
          ) : (
             <button
                onClick={handleTap}
                className={`w-full h-full max-h-[400px] max-w-[400px] rounded-[3rem] transition-all flex justify-center items-center select-none active:scale-95 focus:outline-none focus:ring-4 ring-cyan-200/50 ${
                  phase === 'countdown' ? 'bg-slate-50 cursor-default' :
                  tapped ? 'bg-cyan-50 scale-95 shadow-inner' : 'bg-white hover:bg-slate-50 shadow-md border-2 border-cyan-100 cursor-pointer'
                }`}
             >
                {phase === 'countdown' ? (
                   <span className="text-8xl font-black text-[#03344b] animate-pulse">{countdown}</span>
                ) : (
                   <MousePointerClick className={`w-24 h-24 transition-colors ${tapped ? 'text-cyan-400' : 'text-[#03344b]'}`} />
                )}
             </button>
          )}

        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="flex justify-between items-center px-6 mt-2">
        <button
          onClick={() => { if (phase !== 'active') setPhase('idle'); }}
          disabled={phase === 'active'}
          className="text-slate-500 hover:text-[#03344b] transition-colors flex items-center gap-2 text-[0.8rem] font-bold uppercase tracking-wide disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RefreshCcw className="w-4 h-4" strokeWidth={2.5} />
          Reset Test
        </button>
        <div className="flex items-center gap-2 text-[#03344b] text-[0.8rem] font-bold">
          <span className="text-slate-500 uppercase tracking-wide font-semibold text-[0.75rem]">Sensor Calibration: </span> Optimal
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] ml-1"></span>
        </div>
      </div>
    </div>
  )
}
