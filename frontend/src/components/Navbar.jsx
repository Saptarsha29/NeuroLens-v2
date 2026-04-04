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
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="w-full max-w-6xl bg-slate-950/80 backdrop-blur-xl border border-slate-800 text-white shadow-2xl rounded-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/tests" className="flex items-center gap-3 font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <span className="text-xl">🧠</span>
            <span className="text-white">NeuroLens</span>
          </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-medium text-slate-300">
          {currentUser ? (
            <>
              <Link to="/tests" className="hover:text-white transition-colors">
                Tests
              </Link>
              <Link to="/dashboard" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/history" className="hover:text-white transition-colors">
                History
              </Link>
              <span className="text-slate-500 hidden sm:block border-l border-slate-700 pl-6 ml-2">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 px-4 py-1.5 rounded-lg transition-colors ml-2"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-8 ml-2">
              <div className="flex items-center gap-6 font-semibold text-slate-200 text-[15px] mr-2">
                <Link to="/tests" className="hover:text-white transition-colors">
                  Home
                </Link>
                <Link to="#" className="hover:text-white transition-colors">
                  Docs
                </Link>
              </div>
              <Link
                to="/register"
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white px-5 py-2 text-[15px] font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  </div>
  )
}
