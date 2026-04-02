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
  const [loading, setLoading] = useState(true) // true until Firebase resolves initial auth state
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      // If user is logged in, fetch verification status
      if (user) {
        try {
          const response = await apiClient.get('/verification_status')
          if (response.data.success) {
            setEmailVerified(response.data.email_verified)
          }
        } catch (err) {
          console.error('Failed to fetch verification status:', err)
          setEmailVerified(false)
        }
      } else {
        setEmailVerified(false)
      }

      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function register(name, email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, { displayName: name })
    // Refresh currentUser so displayName is immediately available
    setCurrentUser({ ...result.user, displayName: name })
    // Mark as not verified initially
    setEmailVerified(false)
    return result
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    return signOut(auth)
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
