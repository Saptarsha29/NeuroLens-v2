/**
 * ScoreCard — displays a sub-test score with a colour-coded badge.
 * Props:
 *   label  — string  e.g. "Voice Stability"
 *   score  — number  0-100
 *   icon   — string  emoji or text icon
 */
export default function ScoreCard({ label, score, icon }) {
  const color =
    score >= 80 ? 'text-emerald-400 bg-emerald-900/30 border-emerald-500/20'
    : score >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-rose-400 bg-rose-900/30 border-rose-500/20'

  return (
    <div className={`card border ${color} text-center`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-4xl font-bold">{score !== null ? score : '--'}</p>
      <p className="text-xs mt-1 opacity-70">/ 100</p>
    </div>
  )
}
