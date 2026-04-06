import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

// -- Simple SVG icons --
const Bell = () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
const MapPin = (props) => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
const CheckList = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
const LinkIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
const SearchIcon = ({ stroke = "#94a3b8", width = "20" }) => (
  <svg width={width} height={width} fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const SearchParam = ({ text }) => (
  <div className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer border-r border-slate-200 last:border-0 transition-colors">
    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{text}</span>
  </div>
)

export default function Dashboard() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [weeklyData, setWeeklyData] = useState({ weeks: [], scores: [] })
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('Detecting location...')
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50) // 0-100 percent
  const menuRef = useRef(null)
  const locationRef = useRef(null)
  const sliderRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setIsLocationOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Detect user's geolocation
  useEffect(() => {
    function detectLocation() {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              )
              const data = await response.json()
              const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown'
              const country = data.address?.country || 'Unknown'
              setSelectedLocation(`${city}, ${country}`)
            } catch (e) {
              console.error('Reverse geocoding error:', e)
              setSelectedLocation('Location detected')
            }
            setLocationLoading(false)
          },
          (error) => {
            console.error('Geolocation error:', error)
            setSelectedLocation('Location access denied')
            setLocationLoading(false)
          }
        )
      }
    }
    detectLocation()
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }
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
  }, [currentUser])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const latest = history[0] || null
  const totalTests = history.length
  const avgScore = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.final_score, 0) / history.length).toFixed(1) 
    : 0

  const chartData = weeklyData.weeks.map((w, i) => ({
    week: w,
    score: weeklyData.scores[i],
  }))

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-[#f4f7f9] z-[200] flex items-center justify-center">
         <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Please Login</h2>
            <p className="text-slate-500 mb-6">You must be logged in to view the advanced dashboard.</p>
            <Link to="/login" className="bg-indigo-500 text-white px-6 py-3 rounded-full font-medium shadow hover:bg-indigo-600 transition-colors inline-block w-full">Log In</Link>
         </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] h-screen bg-[#f1f4f8] text-slate-800 font-sans overflow-hidden">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 h-full flex flex-col">
        
        {/* TOP NAVIGATION */}
        <nav className="bg-white rounded-full px-3 py-2 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-slate-100 mb-8 relative z-50">
          <div className="flex items-center gap-6 pl-4">
            <Link to="/dashboard" className="flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full text-xl cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100">🧠</Link>
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link to="/tests" className="flex items-center gap-2 hover:text-indigo-600 transition-colors"><CheckList /> Tests</Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4 pr-2">
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1e2330] text-white shadow-lg shadow-black/10 cursor-pointer hover:scale-105 transition-transform">
              <Bell />
            </div>
            <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 cursor-pointer group relative" ref={menuRef}>
              <div 
                className="flex items-center gap-3 w-full h-full"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="text-right group-hover:opacity-80 transition-opacity">
                  <p className="text-xs text-slate-400 font-medium leading-none">Hello,</p>
                  <p className="text-sm font-bold text-slate-700">{currentUser.displayName || 'User'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-300 to-purple-300 border-[3px] border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold shadow-indigo-200">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              {isMenuOpen && (
                <div className="absolute top-[120%] right-0 mt-2 w-64 bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-800 tracking-wide uppercase">{currentUser.displayName || 'User'}</p>
                      <p className="text-xs text-slate-400 font-medium">@{currentUser.displayName?.replace(/\s+/g, '').toLowerCase() || 'user'}156</p>
                    </div>
                  </div>
                  
                  <div className="py-3">
                    <Link to="/profile" className="w-full text-left px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center gap-3 font-bold">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                         <span className="text-[8px] font-extrabold">{currentUser.displayName ? currentUser.displayName.substring(0, 2).toUpperCase() : 'US'}</span>
                      </div>
                      Profile
                    </Link>
                    <Link to="/history" className="w-full text-left px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center gap-3 font-bold">
                      <span className="text-slate-400 text-lg leading-none shrink-0" style={{ paddingLeft: '1px' }}>📋</span>
                      History
                    </Link>
                    
                    <div className="px-5 mb-2"><div className="h-px bg-slate-100 w-full"></div></div>

                    <button onClick={handleLogout} className="w-full text-left px-5 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-3 font-bold">
                      <span className="text-rose-400 text-lg leading-none shrink-0">↪</span>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* HEADER CONTROLS */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 px-2">
          <div>
            <p className="text-sm text-slate-500 font-medium mb-1">Dashboard &rarr; <span className="text-slate-800 font-bold">All Tests</span></p>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">My Results</h1>
          </div>
          <div className="flex items-center gap-3 pb-2 md:pb-0">
            <button className="bg-indigo-400 hover:bg-indigo-500 transition-colors text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-300/50 whitespace-nowrap">
              Past Result
              <span className="w-6 h-6 rounded-full bg-white text-indigo-500 flex items-center justify-center"><LinkIcon /></span>
            </button>
            <div className="relative" ref={locationRef}>
              <button 
                onClick={() => {
                  setLocationLoading(true)
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords
                      try {
                        const response = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                        )
                        const data = await response.json()
                        const city = data.address?.city || data.address?.town || data.address?.village || 'Unknown'
                        const country = data.address?.country || 'Unknown'
                        setSelectedLocation(`${city}, ${country}`)
                      } catch (e) {
                        console.error('Reverse geocoding error:', e)
                      }
                      setLocationLoading(false)
                    },
                    (error) => {
                      console.error('Geolocation error:', error)
                      setSelectedLocation('Location access denied')
                      setLocationLoading(false)
                    }
                  )
                }}
                className="bg-white hover:bg-slate-50 transition-colors text-slate-700 px-4 py-3 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm border border-slate-200 focus:ring-2 focus:ring-slate-100"
              >
                <MapPin /> {locationLoading ? 'Updating...' : selectedLocation}
              </button>
            </div>
          </div>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 px-2 flex-1 min-h-0 pb-4">
          
          {/* LEFT/CENTER WIDE COLUMN */}
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 hide-scrollbar">
            
            {/* ROW 1: DARK CARD + THREE WHITE STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-6">
              
              {/* DARK CONDITION CARD */}
              <div className="bg-[#0b0c10] rounded-[2rem] p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-indigo-500/5 border border-slate-800">
                <div className="flex items-center justify-between z-10 relative">
                  <h3 className="text-lg font-medium text-slate-100 tracking-wide">Condition Guides</h3>
                  <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer border border-white/5 font-bold pb-2 text-[18px]">...</div>
                </div>
                <div className="bg-white text-black text-[11px] font-bold px-3 py-1.5 rounded-full self-start mt-4 z-10 relative flex items-center gap-1 shadow-sm">
                  <span className="text-slate-400 text-sm leading-none font-normal">↗</span> Heart
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center opacity-90 pointer-events-none mt-4">
                  <div className="w-48 h-48 bg-[#38bdf8]/10 blur-3xl absolute rounded-full"></div>
                  <span 
                    className="text-[160px] filter animate-pulse" 
                    style={{ 
                      filter: 'sepia(1) hue-rotate(185deg) saturate(4.5) brightness(1.1) drop-shadow(0 0 25px rgba(56,189,248,0.8))' 
                    }}>
                    🫀
                  </span>
                </div>

                <div className="mt-40 flex items-end justify-between z-10 relative w-full">
                   <div className="flex flex-col gap-2 pb-2 pl-1">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-500/50"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-500/50"></div>
                      <div className="w-4 h-4 -ml-[1px] rounded-full border-[2px] border-slate-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]"></div>
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-500/50"></div>
                   </div>
                   <div className="text-right">
                     <p className="text-[11px] text-slate-300 font-medium tracking-wide mb-[-2px]">Pulse Rate</p>
                     <p className="text-5xl font-light tracking-tighter text-white">60<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">/100 BMP</span></p>
                   </div>
                </div>
              </div>

              {/* STAT CARDS CONTAINER */}
              <div className="flex flex-col h-full space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">All Test Overview <span className="font-light text-slate-300 mx-2">|</span> {totalTests} <span className="text-sm font-medium text-slate-500 tracking-normal">Tests Found</span></h2>
                  <div className="bg-slate-800 hover:bg-slate-700 transition-colors text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-sm cursor-pointer border border-slate-700">All ▾</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 flex-1">
                  
                  {/* STAT 1 */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-slate-600">Total Tries</p>
                      <span className="text-slate-300 hover:text-slate-500 cursor-pointer font-bold tracking-widest leading-none">...</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-8">
                         <p className="text-4xl font-bold text-slate-800 tracking-tight">{totalTests}</p>
                         <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">+ {totalTests > 0 ? '12' : '0'}%</div>
                      </div>
                      
                      <div className="w-full h-8 border-b-2 border-indigo-100 relative flex items-end justify-center">
                         <div className="w-1 h-[60%] bg-indigo-200 absolute left-[20%] rounded-t-full"></div>
                         <div className="w-1 h-[100%] bg-indigo-500 absolute left-[50%] rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]"></div>
                         <div className="w-1 h-[40%] bg-indigo-200 absolute left-[80%] rounded-t-full"></div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-4 text-center">That's overall usage</p>
                    </div>
                  </div>

                  {/* STAT 2 */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-slate-600">Average Score</p>
                      <span className="text-slate-300 hover:text-slate-500 cursor-pointer font-bold tracking-widest leading-none">...</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-10">
                         <p className="text-4xl font-bold text-slate-800 tracking-tight">{avgScore}</p>
                         <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">+ 4%</div>
                      </div>
                      
                      <div className="w-full relative flex items-center justify-center">
                         <div className="w-full h-[3px] bg-indigo-100 rounded-full"></div>
                         <div className="w-[60%] h-[3px] bg-indigo-500 absolute left-0 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                         <div className="w-1.5 h-6 bg-indigo-500 absolute left-[60%] -mt-3 rounded-full border-2 border-white shadow-sm outline outline-1 outline-indigo-200"></div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-6 text-center">Compared to last month</p>
                    </div>
                  </div>

                  {/* STAT 3 */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-slate-600">Diagnostics</p>
                      <span className="text-slate-300 hover:text-slate-500 cursor-pointer font-bold tracking-widest leading-none">...</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-8">
                         <p className="text-4xl font-bold text-slate-800 tracking-tight">3.85</p>
                         <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">+ 16%</div>
                      </div>
                      
                      <div className="w-full h-8 relative flex items-end justify-center">
                         <div className="w-2 h-full bg-indigo-400 rounded-t-sm shadow-[0_-4px_8px_rgba(129,140,248,0.4)]"></div>
                         <div className="w-2 h-[40%] bg-indigo-100 rounded-t-sm ml-2"></div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-4 text-center">Analytics matched</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* ROW 2: DIAGNOSTICS & TIMELINE */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 hidden sm:grid">
              
              {/* EXPLANATION */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                   <h3 className="font-bold text-slate-800 text-xl leading-tight tracking-tight">Neurology tests<br/>Explanation</h3>
                   <span className="text-slate-300 hover:text-slate-500 cursor-pointer font-bold tracking-widest leading-none -mt-1">...</span>
                </div>
                <p className="text-sm text-slate-400 mb-10 font-medium leading-relaxed pr-4">"Perfect wellness metrics seen on patient's neurological tests"</p>
                
                {/* Interactive slider UI */}
                <div 
                  ref={sliderRef}
                  className="relative w-full h-[4px] bg-slate-100 rounded-full mb-10 cursor-pointer group"
                  onMouseDown={(e) => {
                    const rect = sliderRef.current.getBoundingClientRect()
                    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
                    setSliderPosition(percent)
                  }}
                  onTouchStart={(e) => {
                    const rect = sliderRef.current.getBoundingClientRect()
                    const percent = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100))
                    setSliderPosition(percent)
                  }}
                >
                   <div 
                     className="absolute text-indigo-500 -mt-[9px] transition-all"
                     style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                   >
                      <div className="w-5 h-5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)] border-[4px] border-white cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"></div>
                   </div>
                </div>

                <div className="flex justify-between items-center gap-3">
                   <div className={`w-20 h-20 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-xl border transition-all ${
                     sliderPosition < 33 ? 'bg-[#0e1217] border-slate-800 shadow-slate-300 scale-110 ring-2 ring-indigo-400' : 'bg-[#0e1217] border-slate-800 shadow-slate-300 opacity-60'
                   }`}>🎙️</div>
                   <div className={`w-20 h-20 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-xl border transition-all ${
                     sliderPosition >= 33 && sliderPosition < 66 ? 'bg-[#0e1217] border-slate-800 shadow-slate-300 scale-110 ring-2 ring-indigo-400' : 'bg-[#0e1217] border-slate-800 shadow-slate-300 opacity-60'
                   }`}>✏️</div>
                   <div className={`w-20 h-20 rounded-[1.25rem] flex items-center justify-center text-3xl shadow-xl border transition-all ${
                     sliderPosition >= 66 ? 'bg-[#0e1217] border-slate-800 shadow-slate-300 scale-110 ring-2 ring-indigo-400' : 'bg-[#0e1217] border-slate-800 shadow-slate-300 opacity-60'
                   }`}>👆</div>
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 relative">
                 <div className="flex items-center justify-between mb-8 z-10 relative">
                    <h3 className="font-bold text-slate-800 text-2xl tracking-tight flex items-center gap-3">
                      Results 
                      <span className="text-[10px] font-bold bg-slate-800 text-white rounded-full px-2 py-0.5 tracking-wider shadow-sm">05</span> 
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-3 py-1 cursor-pointer hover:bg-slate-200 transition-colors uppercase tracking-wider">Detailed results ↗</span>
                    </h3>
                    <Link to="/history" className="flex items-center gap-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors rounded-full px-5 py-2.5 font-bold text-slate-600 text-sm shadow-sm group">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] group-hover:bg-indigo-500 transition-colors">↓</span> Get Report Files
                    </Link>
                 </div>

                 <div className="space-y-3 relative mx-4 mb-8">
                    {/* The gray vertical line */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-[2px] bg-slate-50 -z-0"></div>
                    
                    {['Voice', 'Spiral', 'Tap'].map((test, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-1.5 relative z-10 group">
                         <div className="w-[50%] flex items-center bg-slate-50/80 hover:bg-slate-100 transition-colors rounded-full h-12 px-6 border border-slate-100/50">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-right w-full">({test}) Test</span>
                         </div>
                         <div className="w-[50%] flex items-center bg-slate-50/80 hover:bg-slate-100 transition-colors rounded-full h-12 relative border border-slate-100/50">
                            {/* Indicator bubble */}
                            <div className={`w-10 h-10 rounded-xl bg-[#0e1217] absolute -left-5 border-[3px] border-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center text-lg z-20 transition-transform group-hover:scale-110 ${idx === 1 ? 'ring-2 ring-indigo-200' : ''}`}>
                              {['🎙️', '✏️', '👆'][idx]}
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full absolute -left-9 bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)] ${idx===1? 'bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.5)]':''}`}></div>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="flex flex-wrap items-center gap-6 mt-auto pt-6 border-t border-slate-100 text-[10px] font-bold uppercase tracking-widest mt-12">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-rose-400 text-lg leading-[0] mr-0.5 shadow-rose-400 shadow-sm rounded-full">•</span> Voice Test 
                      <span className="text-slate-400 ml-1 cursor-pointer">Normal ▾</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-emerald-400 text-lg leading-[0] mr-0.5 shadow-emerald-400 shadow-sm rounded-full">•</span> Spiral Test
                      <span className="text-slate-400 ml-1 cursor-pointer">Normal ▾</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-indigo-400 text-lg leading-[0] mr-0.5 shadow-indigo-400 shadow-sm rounded-full">•</span> Tap Test 
                      <span className="text-slate-400 ml-1 cursor-pointer">Normal ▾</span>
                    </div>
                 </div>
              </div>

            </div>

          </div>

          {/* RIGHT NARROW COLUMN */}
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 hide-scrollbar">
            
            {/* NEXT STEP BY AI */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 pb-10 group hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="font-bold text-slate-800 text-xl tracking-tight">Next step by AI</h3>
                 <span className="text-slate-400 text-2xl font-light cursor-pointer hover:text-indigo-500 transition-colors bg-white w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center shadow-sm">+</span>
               </div>
               
               <div className="space-y-3.5">
                 <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-full p-2.5 pl-4 focus-within:ring-2 ring-indigo-100 transition-shadow">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600 shadow-inner">1</div>
                    <input type="text" placeholder="Search for clinic" className="bg-transparent border-0 outline-none w-full text-xs font-semibold text-slate-600 placeholder-slate-400" />
                    <SearchIcon width="16" />
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-full p-2.5 pl-4 focus-within:ring-2 ring-indigo-100 transition-shadow">
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600 shadow-inner">2</div>
                    <input type="text" placeholder="Search for Specialist" className="bg-transparent border-0 outline-none w-full text-xs font-semibold text-slate-600 placeholder-slate-400" />
                    <SearchIcon width="16" />
                 </div>
                 
                 <div className="flex items-center justify-between bg-[#475569] rounded-full p-2.5 pl-4 text-white hover:bg-slate-800 transition-colors shadow-md shadow-slate-300 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full border border-slate-400 text-[10px] flex items-center justify-center font-bold bg-white/10">3</div>
                      <span className="text-xs font-bold uppercase tracking-wider">Get Appointment</span>
                    </div>
                    <div className="bg-white text-slate-800 text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wider">10:30 AM</div>
                 </div>

                 <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 group/feature cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-2 rounded-full shadow-sm border border-slate-100 group-hover/feature:bg-indigo-50 transition-colors"><span className="text-xl filter drop-shadow opacity-90 transition-transform">🧠</span></div>
                      <span className="text-sm font-bold text-slate-700 tracking-tight">Relax Brain</span>
                    </div>
                    <span className="text-slate-300 hover:text-slate-500 font-bold tracking-widest leading-none">...</span>
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <div className="bg-indigo-400 text-white rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">4/7 Steps</div>
                    <div className="flex flex-col text-slate-300 text-lg font-light gap-0 cursor-pointer hover:text-slate-500 transition-colors">
                       <span className="leading-[0.5] font-bold">+</span>
                       <span className="leading-[0.5] font-bold">-</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-8 mt-6 border-t border-slate-100 text-slate-700 cursor-pointer group/link">
                    <div className="flex items-center gap-3">
                      <span className="text-xl opacity-70 group-hover/link:opacity-100 transition-opacity">⚖️</span>
                      <span className="text-sm font-bold tracking-tight">Neurology terms</span>
                    </div>
                    <span className="font-bold text-slate-400 group-hover/link:text-slate-800 group-hover/link:translate-x-1 transition-all">↗</span>
                 </div>
               </div>
            </div>

            {/* REVIEW RESULTS CARD */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 group hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-slate-800 text-xl tracking-tight">Review Results</h3>
                 <span className="text-slate-300 hover:text-slate-500 cursor-pointer font-bold tracking-widest leading-none">...</span>
               </div>
               
               <div className="flex flex-col sm:flex-row bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 gap-5 items-center pt-6">
                  <div className="text-5xl font-light tracking-tighter text-slate-800 shrink-0 sm:pr-2 sm:border-r border-slate-200/60">{latest ? latest.final_score.toFixed(0) : '98'}</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-1 w-full text-center sm:text-left">
                     <span className="hover:text-slate-700 cursor-pointer transition-colors leading-snug">Voice Test</span>
                     <span className="hover:text-slate-700 cursor-pointer transition-colors leading-snug">Tap Test</span>
                     <span className="hover:text-slate-700 cursor-pointer transition-colors leading-snug">Checkup Daily</span>
                     <span className="text-indigo-500 cursor-pointer hover:text-indigo-600 transition-colors leading-snug font-extrabold">View All</span>
                  </div>
               </div>

               <div className="flex items-center justify-between mt-8 text-[11px] text-slate-400 font-bold uppercase tracking-wider relative pt-4">
                 <div className="absolute top-0 left-0 right-0 border-t border-slate-100 pointer-events-none"></div>
                 <p className="max-w-[160px] leading-relaxed">Wait 2 min, and then you can take next scan</p>
                 <span className="text-lg cursor-pointer hover:text-slate-600 transition-colors bg-slate-50 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center">→</span>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-100">
                 <p className="text-xs font-bold text-slate-800 mb-4 tracking-wider uppercase">Find your reports</p>
                 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                   <div className="bg-slate-50 px-5 py-4 border border-slate-100 rounded-full flex-1 focus-within:ring-2 ring-indigo-100 transition-shadow text-center sm:text-left">
                     <input type="text" placeholder="Enter your ID" className="bg-transparent border-0 outline-none w-full text-xs font-bold placeholder-slate-400 text-slate-700 text-center sm:text-left" />
                   </div>
                   <button className="bg-indigo-400 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-200/50 rounded-full px-8 py-4 text-[11px] font-extrabold transition-all hover:scale-105 active:scale-95 uppercase tracking-wider shrink-0 break-keep">Search</button>
                 </div>
               </div>
            </div>

            {/* MOCK CHAT BOT COMPONENT */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 min-h-[16rem] flex flex-col hover:shadow-md transition-shadow">
               <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="relative">
                     <div className="w-8 h-8 rounded-full shadow-sm border border-white bg-slate-200"></div>
                     <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight">Sarah Alex</h3>
                  <span className="ml-auto text-slate-300 hover:text-slate-500 cursor-pointer font-bold tracking-widest leading-none">...</span>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-2 space-y-5 hide-scrollbar">
                 <div className="flex items-start gap-3 flex-row-reverse">
                   <div className="text-right">
                      <div className="bg-slate-50 border border-slate-100 rounded-[1.25rem] rounded-tr-sm p-3.5 text-[11px] font-bold text-slate-500 leading-relaxed shadow-sm">
                        How can I get prepare for the Voice test in the Clinic?
                      </div>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0 shadow-sm border border-white mt-1"></div>
                   <div>
                      <div className="bg-indigo-50 text-left border border-indigo-100 rounded-[1.25rem] rounded-tl-sm p-3.5 text-[11px] font-bold text-slate-600 leading-relaxed shadow-sm">
                        Please make sure you are in a quiet environment, avoid loud background noise prior to testing.
                      </div>
                   </div>
                 </div>
               </div>
               
               <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400 text-[11px] font-bold px-2 relative group focus-within:text-slate-700">
                 <input type="text" placeholder="Type here...." className="bg-transparent border-0 outline-none w-full placeholder-slate-300 pr-10 tracking-wide" />
                 <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="absolute right-2 cursor-pointer hover:text-indigo-500 transition-colors"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
