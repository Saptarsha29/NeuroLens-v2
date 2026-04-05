import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <nav className="mx-auto max-w-5xl rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg shadow-black/20">
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight group">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🧠</span>
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              NeuroLens
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link to="/dashboard" className="text-slate-300 hover:text-cyan-400 transition-colors duration-300">
              Home
            </Link>
            <Link to="#" className="text-slate-300 hover:text-cyan-400 transition-colors duration-300">
              Docs
            </Link>

            {currentUser ? (
              <>
                <Link to="/tests" className="text-slate-300 hover:text-cyan-400 transition-colors duration-300">
                  Tests
                </Link>
                <Link to="/dashboard" className="text-slate-300 hover:text-cyan-400 transition-colors duration-300">
                  Dashboard
                </Link>
                <Link to="/history" className="text-slate-300 hover:text-cyan-400 transition-colors duration-300">
                  History
                </Link>
                <span className="text-slate-500 hidden sm:block text-xs">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all duration-300 text-xs font-semibold tracking-wide"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs px-5 py-2 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.5)]"
              >
                Register
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}
