import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'
import apiClient from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // 15 days auto-logout logic
      if (user && user.metadata && user.metadata.lastSignInTime) {
        const lastSignIn = new Date(user.metadata.lastSignInTime).getTime()
        const now = Date.now()
        const diffDays = (now - lastSignIn) / (1000 * 60 * 60 * 24)
        
        if (diffDays > 15) {
          // It's been more than 15 days since they actively typed their password
          signOut(auth)
          setCurrentUser(null)
          setEmailVerified(false)
          setLoading(false)
          return
        }
      }

      setCurrentUser(user)
      setEmailVerified(!!user?.emailVerified)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  async function register(name, email, password) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    if (name?.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() })
    }
    await credential.user.reload()
    const refreshed = auth.currentUser || credential.user
    setCurrentUser(refreshed)
    setEmailVerified(!!refreshed.emailVerified)
    return credential
  }

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    await credential.user.reload()
    const refreshed = auth.currentUser || credential.user
    
    // Check if it's been >90 days since previous login
    try {
      // Must await for the token to be set by Firebase Auth state internally
      const token = await refreshed.getIdToken()
      // Overriding the default header explicitly here to ensure immediate token availability
      await apiClient.post('/record_login', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (err) {
       console.error("Error confirming 90-day login check:", err)
    }

    setCurrentUser(refreshed)
    setEmailVerified(!!refreshed.emailVerified)
    return credential
  }

  async function logout() {
    await signOut(auth)
    setCurrentUser(null)
    setEmailVerified(false)
  }

  const value = { currentUser, emailVerified, loading, register, login, logout }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
