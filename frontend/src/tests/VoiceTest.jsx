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
  const [transcription, setTranscription] = useState('')
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
        setTranscription(data.transcription)
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
    <div className="h-full flex flex-col pt-4 pb-8 pl-[4%]">
      <div className="flex-1 relative w-full flex justify-center items-center">
        <div className="absolute inset-0 bg-white/40 rounded-[3rem] scale-[0.98] -translate-y-4"></div>
        <div className="absolute inset-0 bg-[#f8fbff]/60 rounded-[3rem] scale-[0.95] -translate-y-8 blur-sm"></div>
        
        <div className="relative w-full h-full max-h-[600px] bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(2,30,45,0.05)] border border-[#eaf4fa] flex flex-col justify-center items-center p-8 px-6 lg:px-16 text-center">
          
          <h2 className="text-[#03344b] text-2xl font-bold mb-8">Voice Stability Recording</h2>

          <div className="flex gap-4 mb-8">
            <button
              onClick={startRecording}
              disabled={status === 'recording' || status === 'processing' || status === 'done'}
              className="bg-[#03344b] hover:bg-[#021f2d] text-white px-8 py-4 rounded-full font-bold shadow-lg disabled:opacity-50 transition-all"
            >
              🎙️ Start Recording
            </button>
            <button
              onClick={stopRecording}
              disabled={status !== 'recording'}
              className="bg-rose-100 hover:bg-rose-200 text-rose-800 px-8 py-4 rounded-full font-bold transition-all disabled:opacity-50"
            >
              ⏹️ Stop Recording
            </button>
          </div>

          {status === 'recording' && (
            <div className="flex flex-col items-center gap-2">
              <span className="w-4 h-4 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]"></span>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">Recording...</p>
            </div>
          )}
          {status === 'processing' && (
            <p className="text-sm text-[#7fb8c9] font-bold uppercase tracking-widest animate-pulse">⏳ Processing audio...</p>
          )}
          {error && <p className="text-sm font-semibold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl mt-4">❌ {error}</p>}

          {status === 'done' && score !== null && (
            <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 w-full max-w-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4 mx-auto">
                <span className="text-emerald-500 text-3xl">✅</span>
              </div>
              <p className="text-4xl font-extrabold text-[#03344b]">{score.toFixed(1)} <span className="text-xl text-slate-400 font-medium">/ 100</span></p>
              <p className="text-[#03344b] font-medium text-xs mt-3 uppercase tracking-widest opacity-60">AI Heard: "{transcription || '...'}"</p>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">{scoreLabel(score)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
