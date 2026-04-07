import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { IndividualReportTemplate, ComparisonReportTemplate } from '../components/ReportTemplates'

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
  
  const [selectedResultData, setSelectedResultData] = useState(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const individualPdfRef = useRef(null)
  const comparisonPdfRef = useRef(null)

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

  const generatePDF = async (elementRef, filename) => {
    try {
      setIsGeneratingPdf(true)
      // Allow small delay for chart.js animations or state updates to reflect in DOM
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const canvas = await html2canvas(elementRef.current, {
        scale: 2, // High resolution
        backgroundColor: '#0f172a',
        useCORS: true
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', [canvas.width / 2, canvas.height / 2])
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(filename)
    } catch (error) {
      console.error('Failed to generate PDF', error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
      setSelectedResultData(null)
    }
  }

  const downloadTestResult = (e, r) => {
    e.stopPropagation()
    setSelectedResultData(r)
    // Wait for the component to render the selected data, then generate PDF
    setTimeout(() => {
      generatePDF(individualPdfRef, `NeuroLens_Report_${new Date(r.created_at_iso || r.date).getTime()}.pdf`)
    }, 100)
  }

  const downloadComparison = () => {
    if (!results || results.length === 0) return
    generatePDF(comparisonPdfRef, `NeuroLens_Comparison_Report_${new Date().getTime()}.pdf`)
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
        <div className="flex gap-4 items-center">
          {results.length > 1 && (
            <button 
              onClick={downloadComparison} 
              disabled={isGeneratingPdf}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" lookup="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Compare Results
                </>
              )}
            </button>
          )}
          <Link to="/tests" className="btn-primary">New Test</Link>
        </div>
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
                  {['Date & Time', 'Voice', 'Spiral', 'Tap', 'Final Score', 'Status', 'Download'].map((h) => (
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
                      {r.created_at_iso ? (
                        <>
                          <p className="font-medium text-slate-100">
                            {new Date(r.created_at_iso).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(r.created_at_iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-slate-100">{r.date}</p>
                          <p className="text-xs text-slate-500">{r.time}</p>
                        </>
                      )}
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
                    <td className="px-4 py-3">
                      <button 
                        onClick={(e) => downloadTestResult(e, r)}
                        disabled={isGeneratingPdf}
                        className="text-slate-400 hover:text-cyan-400 p-2 rounded-lg hover:bg-slate-700/50 transition-colors tooltip tooltip-left disabled:opacity-50"
                        data-tip={isGeneratingPdf ? "Processing..." : "Download Report"}
                      >
                        {isGeneratingPdf && selectedResultData?.id === r.id ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden containers for PDF generation */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -100, pointerEvents: 'none' }}>
        <IndividualReportTemplate ref={individualPdfRef} data={selectedResultData} />
        <ComparisonReportTemplate ref={comparisonPdfRef} results={results} />
      </div>
    </div>
  )
}
