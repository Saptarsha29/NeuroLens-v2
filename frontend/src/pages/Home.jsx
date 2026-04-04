import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { currentUser } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center min-h-[85vh] flex flex-col justify-center">
      {/* Hero */}
      <div className="mb-20 pt-28 pb-16 flex flex-col items-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white">
          Not just another test. <br className="hidden md:block"/>
          <span className="text-slate-300">Proactive neurological care.</span>
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          NeuroLens uses your voice and motor skills to detect early signs of Parkinson's disease — making life-saving neurological screening accessible to everyone, anywhere, anytime.
        </p>

        <div className="mt-12 flex justify-center gap-6 flex-wrap">
          {!currentUser ? (
            <>
              <Link to="/tests" className="bg-white text-black hover:bg-slate-200 px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-300">
                Get Started
              </Link>
              <Link to="/login" className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-slate-300 px-8 py-3.5 rounded-full font-medium text-[15px] transition-all duration-300">
                Log In
              </Link>
            </>
          ) : (
            <>
              <Link to="/tests" className="bg-white text-black hover:bg-slate-200 px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-300">
                Start Screening
              </Link>
              <Link to="/dashboard" className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-slate-300 px-8 py-3.5 rounded-full font-medium text-[15px] transition-all duration-300">
                My Dashboard
              </Link>
            </>
          )}
        </div>
      </div>

    </div>
  )
}
