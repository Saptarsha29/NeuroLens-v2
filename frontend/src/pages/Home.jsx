import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { currentUser } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      {/* Hero */}
      <div className="mb-12">
        <span className="text-6xl">🧠</span>
        <h1 className="mt-4 text-5xl font-bold text-slate-100 leading-tight">
          NeuroLens
        </h1>
        <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          NeuroLens uses your voice and motor skills to detect early signs of Parkinson's disease — making life-saving neurological screening accessible to everyone, anywhere, anytime.
        </p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link to="/tests" className="btn-primary text-base">
            Start Screening
          </Link>
          {!currentUser && (
            <Link to="/register" className="btn-secondary text-base">
              Create Account
            </Link>
          )}
          {currentUser && (
            <Link to="/dashboard" className="btn-secondary text-base">
              My Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { icon: '🎙️', title: 'Voice Analysis', desc: 'Detects tremor, jitter, and shimmer in sustained vowel recordings using a trained Random Forest model.' },
          { icon: '✏️', title: 'Spiral Drawing', desc: 'Analyses hand-tremor patterns by measuring path smoothness and direction changes from a freehand spiral.' },
          { icon: '👆', title: 'Tap Speed Test', desc: 'Evaluates motor response speed and rhythm consistency over a 10-second tapping session.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card text-left">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-semibold text-lg text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-12 text-xs text-slate-500 max-w-xl mx-auto">
        NeuroLens is a screening tool only and does not constitute a medical diagnosis.
        Always consult a qualified neurologist for clinical assessment.
      </p>
    </div>
  )
}
