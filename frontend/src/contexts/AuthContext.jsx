import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
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
