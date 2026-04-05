import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import { auth } from '../firebase'

export default function Profile() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-[#f4f7f9] z-[200] flex items-center justify-center">
         <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Please Login</h2>
            <p className="text-slate-500 mb-6">You must be logged in to view your profile.</p>
            <Link to="/login" className="bg-indigo-500 text-white px-6 py-3 rounded-full font-medium shadow hover:bg-indigo-600 transition-colors inline-block w-full">Log In</Link>
         </div>
      </div>
    )
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    if (!displayName.trim()) {
      return setError('Name cannot be empty')
    }
    
    try {
      setLoading(true)
      setError('')
      setMessage('')
      await updateProfile(auth.currentUser, { displayName })
      setMessage('Profile updated successfully!')
      
      // Little trick to force react to see the new display name immediately
      setTimeout(() => { window.location.reload() }, 1000)
    } catch (err) {
      console.error(err)
      setError('Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] min-h-screen bg-[#f1f4f8] text-slate-800 font-sans flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-md w-full rounded-[2rem] p-8 shadow-sm border border-slate-100 relative">
        <Link to="/dashboard" className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 font-bold text-slate-500 hover:text-slate-700">
          &larr;
        </Link>
        <div className="flex flex-col items-center mt-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-300 to-purple-300 border-4 border-white shadow-lg ring-1 ring-slate-100 mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Your Profile</h2>
          <p className="text-sm text-slate-500 font-medium mb-8 text-center px-4 mt-2 leading-relaxed">Update your account settings or log out safely from your current session below.</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-500 text-sm p-3 rounded-xl mb-4 text-center border border-rose-100 font-medium">{error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl mb-4 text-center border border-emerald-100 font-medium">{message}</div>}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/60 rounded-full px-5 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-2 mt-4">Email Address</label>
            <input 
              type="text" 
              value={currentUser.email || ''}
              disabled
              className="w-full bg-slate-100 border border-slate-200/50 rounded-full px-5 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed"
            />
            <p className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 text-center mt-3">Email address is read-only</p>
          </div>

          <div className="pt-6 pb-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-full py-4 text-[11px] font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-200/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
