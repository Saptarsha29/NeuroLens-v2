import React, { forwardRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Individual Report Template
export const IndividualReportTemplate = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const dateStr = data.created_at_iso
    ? new Date(data.created_at_iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : data.date;

  const getStatusText = (score) => {
    if (score >= 80) return { text: 'HEALTHY', color: '#10b981' };
    if (score >= 60) return { text: 'STABLE', color: '#f59e0b' };
    return { text: 'RISK', color: '#ef4444' };
  };

  const finalStatus = getStatusText(data.final_score);
  const voiceStatus = getStatusText(data.voice_score);
  const spiralStatus = getStatusText(data.spiral_score);
  const tapStatus = getStatusText(data.tap_score);

  return (
    <div
      ref={ref}
      style={{
        width: '800px',
        padding: '40px',
        backgroundColor: '#0f172a', // slate-900
        color: '#f8fafc', // slate-50
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>INDIVIDUAL TEST REPORT</h1>
          <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>ID: NP-{(data.id || Math.floor(Math.random() * 10000)).toString().padStart(4, '0')}-XQ</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Examination Date</p>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{dateStr.toUpperCase()}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Main Score Card */}
        <div style={{
          flex: '1',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#334155', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: finalStatus.color }}>
            {finalStatus.text}
          </div>
          <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Aggregate Neuro-Intelligence Score</p>
          <div style={{ fontSize: '80px', fontWeight: 'bold', lineHeight: '1' }}>{data.final_score?.toFixed(1)}</div>
          
          <div style={{ width: '100%', height: '6px', background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)', borderRadius: '3px', margin: '20px 0' }} />
          
          <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', textAlign: 'center' }}>
            Subject performance recorded and measured against aggregate developmental baselines.
          </p>
        </div>

        {/* Sub Scores */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {[
            { label: 'Voice Analysis', desc: 'Jitter, Shimmer, & HNR metrics', score: data.voice_score, status: voiceStatus },
            { label: 'Spiral Precision', desc: 'Visuospatial coordination tracking', score: data.spiral_score, status: spiralStatus },
            { label: 'Finger Tap Speed', desc: 'Motor rhythm & latent response', score: data.tap_score, status: tapStatus }
          ].map((item, idx) => (
            <div key={idx} style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{item.label}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>{item.desc}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{item.score?.toFixed(1)}</div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: item.status.color }}>{item.status.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Interpretation */}
        <div style={{ flex: '1.5', backgroundColor: '#1e293b', borderRadius: '16px', padding: '30px' }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', color: '#f472b6', textTransform: 'uppercase', letterSpacing: '1px' }}>📄 Medical Interpretation</h3>
          <p style={{ margin: 0, fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6' }}>
            The subject demonstrates a consistent overall metric. Individual components display minor variances inherent to normal cognitive loading. 
            {data.spiral_score < 60 && ' The Spiral Precision metric indicates deviation requiring potential monitoring. '}
            {data.voice_score < 60 && ' Voice analysis indicates tremoring that warrants follow-up. '}
            {data.tap_score < 60 && ' Motor rhythm tests show slightly reduced cadence. '}
            {data.final_score >= 80 ? ' Overall metrics show optimal neurological tracking capability.' : 
             data.final_score >= 60 ? ' Current baseline represents stable condition. Periodic assessment recommended.' : 
             ' Detailed clinical evaluation is highly advised to rule out progressive motor decay.'}
          </p>
        </div>
      </div>
    </div>
  );
});

// Comparison Report Template
export const ComparisonReportTemplate = forwardRef(({ results }, ref) => {
  if (!results || results.length === 0) return null;

  // Sort chronologically for chart
  const sortedResults = [...results].sort((a, b) => {
    return new Date(a.created_at_iso || a.date).getTime() - new Date(b.created_at_iso || b.date).getTime();
  });

  const labels = sortedResults.map(r => new Date(r.created_at_iso || r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const trendData = sortedResults.map(r => r.final_score);

  const healthyCount = results.filter(r => r.final_score >= 80).length;
  const riskCount = results.filter(r => r.final_score < 60).length;
  const stableCount = results.length - healthyCount - riskCount;

  const currentScore = sortedResults[sortedResults.length - 1].final_score;
  const previousScore = sortedResults.length > 1 ? sortedResults[sortedResults.length - 2].final_score : currentScore;
  const diff = currentScore - previousScore;
  const diffText = diff >= 0 ? `+${diff.toFixed(1)} vs Last` : `${diff.toFixed(1)} vs Last`;
  const diffColor = diff >= 0 ? '#10b981' : '#ef4444';

  return (
    <div
      ref={ref}
      style={{
        width: '900px',
        padding: '40px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>Comprehensive Neurological Report</h1>
        <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Analysis of your tests over time</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {/* Trend Chart */}
        <div style={{ flex: '2', backgroundColor: '#1e293b', borderRadius: '16px', padding: '25px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>Final Score Trend</h3>
          <div style={{ height: '220px' }}>
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: 'Score',
                    data: trendData,
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#ec4899',
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                  y: { display: false, min: 0, max: 100 },
                  x: { grid: { display: false, color: '#334155' }, ticks: { color: '#94a3b8' } }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
              }}
            />
          </div>
        </div>

        {/* Outcome Mix */}
        <div style={{ flex: '1', backgroundColor: '#1e293b', borderRadius: '16px', padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', alignSelf: 'flex-start' }}>Outcome Mix</h3>
          <div style={{ width: '160px', height: '160px', position: 'relative' }}>
            <Doughnut
              data={{
                labels: ['Healthy', 'Stable', 'Risk'],
                datasets: [{
                  data: [healthyCount, stableCount, riskCount],
                  backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                  borderWidth: 0,
                  cutout: '80%'
                }]
              }}
              options={{ animation: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{Math.round((healthyCount / results.length) * 100)}%</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Healthy</span>
            </div>
          </div>
          <div style={{ width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
            <span>Healthy: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{healthyCount}</span></span>
            <span>At Risk: <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{riskCount}</span></span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Metric Breakdown */}
        <div style={{ flex: '1', backgroundColor: '#1e293b', borderRadius: '16px', padding: '25px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8' }}>Metric Breakdown</h3>
          {[
            { label: 'VOICE ANALYSIS', score: sortedResults[sortedResults.length - 1].voice_score },
            { label: 'SPIRAL PRECISION', score: sortedResults[sortedResults.length - 1].spiral_score },
            { label: 'FINGER TAP SPEED', score: sortedResults[sortedResults.length - 1].tap_score }
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                <span>{item.score?.toFixed(1)}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.max(0, item.score))}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Status Box */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ flex: 1, backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Overall Health: {currentScore >= 60 ? 'Stable' : 'At Risk'}</h4>
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#94a3b8' }}>
              Cognitive variance indicates {diff >= 0 ? "improvement" : "slight decline"} vs previous baseline. Trend variance: <span style={{ color: diffColor, fontWeight: 'bold' }}>{diffText}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
