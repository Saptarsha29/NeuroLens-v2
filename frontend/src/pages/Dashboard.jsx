import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'
import ScoreCard from '../components/ScoreCard'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [history, setHistory] = useState([])
  const [weeklyData, setWeeklyData] = useState({ weeks: [], scores: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [histRes, weekRes] = await Promise.all([
          client.get('/history'),
          client.get('/weekly_data'),
        ])
        setHistory(histRes.data.results || [])
        setWeeklyData({ weeks: weekRes.data.weeks, scores: weekRes.data.scores })
      } catch (e) {
        console.error('Dashboard load error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const latest = history[0] || null
  const totalTests = history.length

  const chartData = weeklyData.weeks.map((w, i) => ({
    week: w.replace('Week ', 'W').replace(/,.*/, ''),
    score: weeklyData.scores[i],
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">
          Welcome back, {currentUser?.displayName || 'User'} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's your neurological health overview.</p>
      </div>

      {loading ? (
        <p className="text-slate-500 animate-pulse">Loading your data…</p>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card text-center">
              <p className="text-3xl font-bold text-primary">{totalTests}</p>
              <p className="text-sm text-slate-400 mt-1">Total Tests</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-slate-100">
                {latest ? latest.final_score.toFixed(1) : '--'}
              </p>
              <p className="text-sm text-slate-400 mt-1">Latest Score</p>
            </div>
            <div className="card text-center col-span-2">
              <p className="text-sm text-slate-400">Last tested</p>
              <p className="font-semibold text-slate-100 mt-1">
                {latest ? latest.date : 'No tests yet'}
              </p>
            </div>
          </div>

          {/* Latest sub-scores */}
          {latest && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-100 mb-3">Latest Test Breakdown</h2>
              <div className="grid grid-cols-3 gap-4">
                <ScoreCard label="Voice Stability" score={latest.voice_score} icon="🎙️" />
                <ScoreCard label="Hand Tremor" score={latest.spiral_score} icon="✏️" />
                <ScoreCard label="Motor Response" score={latest.tap_score} icon="👆" />
              </div>
            </div>
          )}

          {/* Weekly trend chart */}
          {chartData.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Weekly Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickCount={6} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v}`, 'Avg Score']} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3498db"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3498db' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-4 flex-wrap">
            <Link to="/tests" className="btn-primary">Start New Test</Link>
            <Link to="/history" className="btn-secondary">View Full History</Link>
          </div>
        </>
      )}
    </div>
  )
}
