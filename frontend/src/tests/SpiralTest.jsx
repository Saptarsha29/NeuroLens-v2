import { useRef, useState, useEffect } from 'react'
import client from '../api/client'

function scoreLabel(score) {
  if (score >= 80) return 'Drawing shows stable hand control with minimal tremors'
  if (score >= 60) return 'Some minor irregularities detected in hand movement'
  return 'Drawing analysis shows notable hand movement irregularities'
}

/**
 * Draws a dashed spiral guide and a blue center dot on the canvas.
 * Logic ported verbatim from static/js/spiral.js:drawGuide().
 */
function drawGuide(ctx, width, height) {
  const centerX = width / 2
  const centerY = height / 2

  ctx.save()
  ctx.strokeStyle = '#bae6fd' // Light cyan guides instead of ash grey
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  for (let angle = 0; angle < 6 * Math.PI; angle += 0.1) {
    const radius = angle * 10
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    if (angle === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = '#3498db'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI)
  ctx.fill()
}

export default function SpiralTest({ onComplete }) {
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const startTimeRef = useRef(null)
  const drawingDataRef = useRef([])

  const [status, setStatus] = useState('idle') // idle | drawing | processing | done | error
  const [score, setScore] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#0284c7' // Bright professional blue for the drawing
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    drawGuide(ctx, canvas.width, canvas.height)
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let clientX = e.clientX
    let clientY = e.clientY
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    }
    
    return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    }
  }

  function handleStart(e) {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)

    isDrawingRef.current = true
    startTimeRef.current = Date.now()
    drawingDataRef.current = []

    ctx.beginPath()
    ctx.moveTo(x, y)
    drawingDataRef.current.push({ x, y, time: 0 })
    setStatus('drawing')
  }

  function handleMove(e) {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPos(e, canvas)

    ctx.lineTo(x, y)
    ctx.stroke()
    drawingDataRef.current.push({ x, y, time: Date.now() - startTimeRef.current })
  }

  function handleStop(e) {
    e.preventDefault()
    if (isDrawingRef.current) {
      canvasRef.current.getContext('2d').closePath()
      isDrawingRef.current = false
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGuide(ctx, canvas.width, canvas.height)
    drawingDataRef.current = []
    setStatus('idle')
    setScore(null)
    setError('')
  }

  async function submit() {
    if (drawingDataRef.current.length < 10) {
      setError('Please draw a complete spiral (need at least 10 points).')
      return
    }
    setError('')
    setStatus('processing')
    try {
      const { data } = await client.post('/analyze_spiral', { points: drawingDataRef.current })
      if (data.success) {
        setScore(data.spiral_score)
        setMetrics(data.metrics)
        setStatus('done')
        onComplete(data.spiral_score)
      } else {
        throw new Error(data.detail || 'Analysis failed')
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Error analysing drawing')
      setStatus('error')
    }
  }

  return (
    <div className="h-full flex flex-col pt-4 pb-8 pl-[4%]">
      <div className="flex-1 relative w-full flex justify-center items-center">
        <div className="absolute inset-0 bg-white/40 rounded-[3rem] scale-[0.98] -translate-y-4"></div>
        <div className="absolute inset-0 bg-[#f8fbff]/60 rounded-[3rem] scale-[0.95] -translate-y-8 blur-sm"></div>
        
        <div className="relative w-full h-full max-h-[650px] bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(2,30,45,0.05)] border border-[#eaf4fa] flex flex-col justify-center items-center p-8 px-6 lg:px-16 text-center">
          
          <h2 className="text-[#03344b] text-2xl font-bold mb-4">Spiral Drawing Canvas</h2>

          <div className="w-full max-w-[400px] flex justify-center py-2 bg-white shadow-[0_4px_25px_rgba(14,165,233,0.1)] rounded-[2rem] border-2 border-cyan-100/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(186,230,253,0.1)_0%,transparent_70%)] pointer-events-none"></div>
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="cursor-crosshair touch-none w-full max-w-[400px] object-contain rounded-2xl relative z-10"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleStop}
              onMouseOut={handleStop}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleStop}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={clearCanvas} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-3 rounded-full font-bold shadow-sm disabled:opacity-50 transition-all text-sm uppercase tracking-widest" disabled={status === 'processing'}>
              Clear
            </button>
            <button
              onClick={submit}
              className="bg-[#03344b] hover:bg-[#021f2d] text-white px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50 transition-all text-sm uppercase tracking-widest flex items-center gap-2"
              disabled={status === 'processing' || status === 'done'}
            >
              {status === 'processing' && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>}
              {status === 'processing' ? 'Analysing...' : 'Submit Drawing'}
            </button>
          </div>

          {error && <p className="text-sm font-semibold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl mt-4">❌ {error}</p>}

          {status === 'done' && score !== null && (
             <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 w-full max-w-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2 mx-auto">
                <span className="text-emerald-500 text-2xl">✅</span>
              </div>
              <p className="text-4xl font-extrabold text-[#03344b]">{score.toFixed(1)} <span className="text-xl text-slate-400 font-medium">/ 100</span></p>
              <p className="text-[#03344b] font-medium text-[0.65rem] mt-2 uppercase tracking-widest opacity-60">Result</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
