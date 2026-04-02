import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import ScoreCard from '../components/ScoreCard'

function scoreColor(s) {
  return s >= 80 ? '#2ecc71' : s >= 60 ? '#f39c12' : '#e74c3c'
}

export default function Results() {
  const navigate = useNavigate()
  const [results, setResults] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('neuroLensResults')
    if (!raw) return navigate('/tests')
    setResults(JSON.parse(raw))
  }, [navigate])

  if (!results) return null

  const { voice_score, spiral_score, tap_score, final_score, status, status_color } = results

  const radarData = [
    { label: 'Voice Stability', value: voice_score },
    { label: 'Hand Tremor', value: spiral_score },
    { label: 'Motor Response', value: tap_score },
  ]

  const barData = [
    { name: 'Voice', score: voice_score },
    { name: 'Spiral', score: spiral_score },
    { name: 'Tap', score: tap_score },
  ]

  const statusBg = status_color === 'green'
    ? 'bg-emerald-900/30 border-green-300 text-emerald-400'
    : status_color === 'orange'
    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
    : 'bg-rose-900/30 border-red-300 text-red-700'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-100 mb-2">Your Results</h1>
      <p className="text-slate-400 mb-8">Neurological Wellness Screening Report</p>

      {/* Final score */}
      <div className={`card border mb-8 text-center ${statusBg}`}>
        <p className="text-sm font-medium uppercase tracking-wide opacity-70">Overall Score</p>
        <p className="text-7xl font-bold mt-2">{final_score.toFixed(1)}</p>
        <p className="text-xl font-semibold mt-2">{status}</p>
        {/* Progress bar */}
        <div className="mt-4 h-3 /50 rounded-full overflow-hidden max-w-sm mx-auto">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${final_score}%`, backgroundColor: scoreColor(final_score) }}
          />
        </div>
      </div>

      {/* Sub-score cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <ScoreCard label="Voice Stability" score={voice_score} icon="🎙️" />
        <ScoreCard label="Hand Tremor" score={spiral_score} icon="✏️" />
        <ScoreCard label="Motor Response" score={tap_score} icon="👆" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Radar */}
        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Score Profile</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
              <Radar
                dataKey="value"
                stroke="#3498db"
                fill="#3498db"
                fillOpacity={0.3}
                dot={{ r: 4, fill: '#3498db' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Test Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v.toFixed(1)}`, 'Score']} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={scoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status guide */}
      <div className="card mb-8">
        <h3 className="font-semibold text-slate-100 mb-3">Score Guide</h3>
        <div className="space-y-2 text-sm">
          {[
            { range: '80 – 100', label: 'Healthy', color: 'badge-healthy', note: 'Results within normal range' },
            { range: '60 – 79', label: 'Monitor', color: 'badge-monitor', note: 'Some irregularities — monitor over time' },
            { range: '0 – 59', label: 'Possible Risk', color: 'badge-risk', note: 'Consult a neurologist' },
          ].map(({ range, label, color, note }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={color}>{label}</span>
              <span className="text-slate-500">{range}</span>
              <span className="text-slate-400">{note}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          * This tool is for screening only and does not constitute a medical diagnosis.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <Link to="/tests" className="btn-primary">Take Test Again</Link>
        <Link to="/dashboard" className="btn-secondary">View Dashboard</Link>
      </div>
    </div>
  )
}
