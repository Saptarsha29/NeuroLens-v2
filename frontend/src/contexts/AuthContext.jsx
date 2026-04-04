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
    // MOCK: Pretend we are NOT logged in, so you can see the Sign In / Register pages!
    setLoading(true)
    setTimeout(() => {
      setCurrentUser(null)
      setEmailVerified(false)
      setLoading(false)
    }, 100)
    return () => {}
  }, [])

  async function register(name, email, password) {
    // MOCK: Fake registration
    const user = { uid: 'mock_uid', email, displayName: name }
    setCurrentUser(user)
    setEmailVerified(false)
    return { user }
  }

  async function login(email, password) {
    // MOCK: Fake login
    const user = { uid: 'mock_uid', email, displayName: 'Fake User' }
    setCurrentUser(user)
    setEmailVerified(true)
    return { user }
  }

  async function logout() {
    // MOCK: Fake logout
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
