import { useState, useRef } from 'react'
import client from '../api/client'

/**
 * Converts a WAV AudioBuffer to a WAV Blob.
 * Logic ported verbatim from static/js/voice.js:audioBufferToWav().
 */
function audioBufferToWav(audioBuffer) {
  const numberOfChannels = 1
  const sampleRate = audioBuffer.sampleRate
  const format = 1     // PCM
  const bitDepth = 16

  let audioData
  if (audioBuffer.numberOfChannels === 1) {
    audioData = audioBuffer.getChannelData(0)
  } else {
    const left = audioBuffer.getChannelData(0)
    const right = audioBuffer.getChannelData(1)
    audioData = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) {
      audioData[i] = (left[i] + right[i]) / 2
    }
  }

  const samples = new Int16Array(audioData.length)
  for (let i = 0; i < audioData.length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]))
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, (sampleRate * numberOfChannels * bitDepth) / 8, true)
  view.setUint16(32, (numberOfChannels * bitDepth) / 8, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  const dataView = new Int16Array(buffer, 44)
  dataView.set(samples)

  return new Blob([buffer], { type: 'audio/wav' })
}

function scoreLabel(score) {
  if (score >= 80) return 'Voice patterns indicate stable vocal control'
  if (score >= 60) return 'Some minor irregularities detected in voice patterns'
  return 'Voice analysis shows notable irregularities'
}

export default function VoiceTest({ onComplete }) {
  const [status, setStatus] = useState('idle') // idle | recording | processing | done | error
  const [score, setScore] = useState(null)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 44100 },
      })
      streamRef.current = stream

      const options = MediaRecorder.isTypeSupported('audio/wav')
        ? { mimeType: 'audio/wav' }
        : { mimeType: 'audio/webm' }

      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        stream.getTracks().forEach((t) => t.stop())
        await convertAndAnalyze(blob)
      }

      recorder.start()
      setStatus('recording')
    } catch {
      setError('Could not access microphone. Please allow microphone permission.')
      setStatus('error')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setStatus('processing')
    }
  }

  async function convertAndAnalyze(blob) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 })
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const wavBlob = audioBufferToWav(audioBuffer)
      await analyzeVoice(wavBlob)
    } catch (e) {
      setError('Error converting audio format. Please try again.')
      setStatus('error')
    }
  }

  async function analyzeVoice(wavBlob) {
    try {
      const formData = new FormData()
      formData.append('audio', wavBlob, 'recording.wav')
      const { data } = await client.post('/analyze_voice', formData)
      if (data.success) {
        setScore(data.voice_score)
        setStatus('done')
        onComplete(data.voice_score)
      } else {
        throw new Error(data.error || 'Analysis failed')
      }
    } catch (e) {
      setError(e.message || 'Error analysing audio')
      setStatus('error')
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">🎙️ Voice Stability Test</h2>
      <p className="text-sm text-slate-400 mb-4">
        Click <strong>Start Recording</strong>, say <em>"I AM THE BEST"</em> in a steady tone for 3 seconds,
        then click <strong>Stop Recording</strong>.
      </p>

      <div className="flex gap-3 mb-4">
        <button
          onClick={startRecording}
          disabled={status === 'recording' || status === 'processing' || status === 'done'}
          className="btn-primary"
        >
          🎙️ Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={status !== 'recording'}
          className="btn-secondary"
        >
          ⏹️ Stop Recording
        </button>
      </div>

      {status === 'recording' && (
        <p className="text-sm text-rose-400 animate-pulse">🔴 Recording… speak steadily</p>
      )}
      {status === 'processing' && (
        <p className="text-sm text-cyan-400">⏳ Processing audio…</p>
      )}
      {error && <p className="text-sm text-rose-400">❌ {error}</p>}

      {status === 'done' && score !== null && (
        <div className="mt-4 p-4 bg-emerald-900/30 border border-emerald-500/20 rounded-lg">
          <p className="font-semibold text-emerald-400">✅ Voice Analysis Complete</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{score.toFixed(1)} / 100</p>
          <p className="text-sm text-slate-400 mt-1">{scoreLabel(score)}</p>
        </div>
      )}
    </div>
  )
}
