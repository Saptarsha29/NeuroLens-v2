import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { VerificationProvider } from './contexts/VerificationContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import VerificationGuard from './components/VerificationGuard'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import EmailVerification from './pages/EmailVerification'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Results from './pages/Results'
import TestsPage from './tests/TestsPage'

function AppContent() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/tests'

  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/results" element={<Results />} />

          {/* Protected routes - require verification */}
          <Route element={<VerificationGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <VerificationProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </VerificationProvider>
    </AuthProvider>
  )
}
