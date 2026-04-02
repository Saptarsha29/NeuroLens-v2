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
    <nav className="bg-secondary text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-primary text-2xl">🧠</span>
          NeuroLens
        </Link>

        {/* Links */}
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/tests" className="hover:text-primary transition-colors">
            Tests
          </Link>

          {currentUser ? (
            <>
              <Link to="/dashboard" className="hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link to="/history" className="hover:text-primary transition-colors">
                History
              </Link>
              <span className="text-slate-500 hidden sm:block">
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-rose-900/300 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-primary transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-primary hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
