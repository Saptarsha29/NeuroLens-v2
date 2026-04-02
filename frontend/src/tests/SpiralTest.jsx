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
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
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
    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    drawGuide(ctx, canvas.width, canvas.height)
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
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
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">✏️ Spiral Drawing Test</h2>
      <p className="text-sm text-slate-400 mb-4">
        Trace over the dashed spiral guide from the center outward. Try to follow it as smoothly as
        possible.
      </p>

      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="border border-slate-700/50 rounded-lg cursor-crosshair touch-none w-full max-w-lg"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleStop}
        onMouseOut={handleStop}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleStop}
      />

      <div className="flex gap-3 mt-4">
        <button onClick={clearCanvas} className="btn-secondary" disabled={status === 'processing'}>
          Clear
        </button>
        <button
          onClick={submit}
          className="btn-primary"
          disabled={status === 'processing' || status === 'done'}
        >
          {status === 'processing' ? '⏳ Analysing…' : 'Submit Drawing'}
        </button>
      </div>

      {error && <p className="text-sm text-rose-400 mt-3">❌ {error}</p>}

      {status === 'done' && score !== null && (
        <div className="mt-4 p-4 bg-emerald-900/30 border border-emerald-500/20 rounded-lg">
          <p className="font-semibold text-emerald-400">✅ Spiral Analysis Complete</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{score.toFixed(1)} / 100</p>
          <p className="text-sm text-slate-400 mt-1">{scoreLabel(score)}</p>
          {metrics && (
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>Smoothness: {metrics.path_smoothness.toFixed(2)}</span>
              <span>Direction changes: {metrics.direction_changes}</span>
              <span>Time: {(metrics.total_time / 1000).toFixed(1)}s</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
