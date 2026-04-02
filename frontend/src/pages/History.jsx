import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'

function StatusBadge({ score }) {
  if (score >= 80) return <span className="badge-healthy">Healthy</span>
  if (score >= 60) return <span className="badge-monitor">Monitor</span>
  return <span className="badge-risk">Risk</span>
}

export default function History() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleRowClick = (r) => {
    // Reconstruct the status tracking for the detailed Results view
    const status = r.final_score >= 80 ? 'Healthy' : r.final_score >= 60 ? 'Monitor' : 'Possible Risk'
    const status_color = r.final_score >= 80 ? 'green' : r.final_score >= 60 ? 'orange' : 'red'
    
    sessionStorage.setItem('neuroLensResults', JSON.stringify({
      ...r,
      status,
      status_color
    }))
    navigate('/results')
  }

  useEffect(() => {
    async function load() {
      try {
        const { data } = await client.get('/history')
        setResults(data.results || [])
      } catch {
        setError('Failed to load history. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Test History</h1>
          <p className="text-slate-400 mt-1">All your past neurological screenings</p>
        </div>
        <Link to="/tests" className="btn-primary">New Test</Link>
      </div>

      {loading && <p className="text-slate-500 animate-pulse">Loading history…</p>}
      {error && <p className="text-rose-400">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <div className="card text-center py-16">
          <p className="text-4xl mb-4">🧠</p>
          <p className="text-slate-400 text-lg font-medium">No tests yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-6">Complete your first screening to see results here.</p>
          <Link to="/tests" className="btn-primary">Start Screening</Link>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700/50">
                  {['Date & Time', 'Voice', 'Spiral', 'Tap', 'Final Score', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-300 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr 
                    key={r.id} 
                    onClick={() => handleRowClick(r)}
                    className="border-b border-slate-700/50 hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-slate-100">{r.date}</p>
                      <p className="text-xs text-slate-500">{r.time}</p>
                    </td>
                    <td className="px-4 py-3 font-mono">{r.voice_score?.toFixed(1)}</td>
                    <td className="px-4 py-3 font-mono">{r.spiral_score?.toFixed(1)}</td>
                    <td className="px-4 py-3 font-mono">{r.tap_score?.toFixed(1)}</td>
                    <td className="px-4 py-3 font-bold font-mono text-slate-100">
                      {r.final_score?.toFixed(1)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge score={r.final_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
